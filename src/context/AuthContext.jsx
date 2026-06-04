/*
 * SUPABASE TABLES — run this SQL in your Supabase SQL editor:
 *
 * create table client_settings (
 *   id uuid default gen_random_uuid() primary key,
 *   client_id uuid references clients(id),
 *   branding jsonb default '{}',
 *   pdf_content jsonb default '{}',
 *   email_settings jsonb default '{}',
 *   language_settings jsonb default '{}',
 *   updated_at timestamp with time zone default now()
 * );
 *
 * create table client_pricing (
 *   id uuid default gen_random_uuid() primary key,
 *   client_id uuid references clients(id),
 *   base_prices jsonb default '{}',
 *   fixed_costs jsonb default '{}',
 *   per_meter_costs jsonb default '{}',
 *   addons jsonb default '{}',
 *   rot_enabled boolean default false,
 *   rot_percentage numeric default 30,
 *   currency text default 'SEK',
 *   updated_at timestamp with time zone default now()
 * );
 *
 * create table client_municipalities (
 *   id uuid default gen_random_uuid() primary key,
 *   client_id uuid references clients(id),
 *   municipality text not null,
 *   zone integer default 1,
 *   custom_price integer
 * );
 *
 * create table client_questions (
 *   id uuid default gen_random_uuid() primary key,
 *   client_id uuid references clients(id),
 *   question_key text not null,
 *   label_en text, label_sv text, label_de text, label_fr text,
 *   helper_en text, helper_sv text, helper_de text, helper_fr text,
 *   visible boolean default true,
 *   updated_at timestamp with time zone default now(),
 *   unique(client_id, question_key)
 * );
 */

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ensureClientData } from '../utils/ensureClientData';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    if (data?.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('active')
        .eq('id', data.client_id)
        .single();
      if (clientData && clientData.active === false) {
        await supabase.auth.signOut();
        return null;
      }
    }
    return data;
  }

  async function initializeClientData(clientId) {
    if (!clientId) return;
    try { await ensureClientData(supabase, clientId); } catch (err) { console.error('initializeClientData failed:', err); }
  }

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (initialized.current) return;
      if (session?.user) {
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        initialized.current = true;
        if (profileData?.client_id) {
          initializeClientData(profileData.client_id);
        }
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return;

        if (event === 'TOKEN_REFRESHED') {
          if (session?.user) setUser(session.user);
          return;
        }

        if (event === 'SIGNED_IN') {
          if (initialized.current) {
            if (session?.user) setUser(session.user);
            return;
          }
          if (session?.user) {
            setUser(session.user);
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            setLoading(false);
            initialized.current = true;
            if (profileData?.client_id) {
              initializeClientData(profileData.client_id);
            }
          }
          return;
        }

        if (event === 'USER_UPDATED') {
          if (session?.user) {
            setUser(session.user);
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            setLoading(false);
            if (profileData?.client_id) {
              initializeClientData(profileData.client_id);
            }
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
          initialized.current = false;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    return { data };
  }

  async function signOut() {
    sessionStorage.removeItem('qq360_client_plan');
    await supabase.auth.signOut();
  }

  const value = { user, profile, loading, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
