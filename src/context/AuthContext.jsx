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

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return data;
  }

  async function initializeClientData(clientId) {
    if (!clientId) return;

    // Ensure client_settings row exists
    const { data: existingSettings } = await supabase
      .from('client_settings')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle();

    if (!existingSettings) {
      await supabase.from('client_settings').insert({
        client_id: clientId,
        branding: {},
        pdf_content: {},
        email_settings: {},
        language_settings: {},
      });
    }

    // Ensure client_pricing row exists
    const { data: existingPricing } = await supabase
      .from('client_pricing')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle();

    if (!existingPricing) {
      await supabase.from('client_pricing').insert({
        client_id: clientId,
        base_prices: {
          bdt:    { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
          wc:     { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
          wc_bdt: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        },
        fixed_costs: {
          planning: 0, establishment_zone1: 0, establishment_zone2: 0,
          de_establishment: 0, admin: 0, inspection: 0,
        },
        per_meter_costs: {
          gravity_pipe: 0, pressure_pipe: 0, protection_pipe: 0,
          cable: 0, makadam: 0, labor: 0,
        },
        addons: {
          pump_well: 0, double_pump: 0, telescope_cover: 0,
          lawn_restoration_base: 0, mass_removal: 0, transport: 0,
        },
        rot_enabled: false,
        rot_percentage: 30,
        currency: 'SEK',
      });
    }
  }

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        if (profileData?.client_id) {
          await initializeClientData(profileData.client_id);
        }
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          if (profileData?.client_id) {
            await initializeClientData(profileData.client_id);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
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
    await supabase.auth.signOut();
  }

  const value = { user, profile, loading, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
