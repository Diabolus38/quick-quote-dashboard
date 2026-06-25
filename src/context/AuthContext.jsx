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

  // initialized = fully resolved (profile set, loading cleared)
  // initializing = work has been claimed by one path (prevents double-run race)
  const initialized  = useRef(false);
  const initializing = useRef(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    if (data?.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('active')
        .eq('id', data.client_id)
        .maybeSingle();
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

  // Creates the profile + client rows for a first-time user, then returns a
  // freshly-fetched profile. Called only when fetchProfile returns null.
  async function ensureNewUserData(session) {
    const selectedPlan = session.user.user_metadata?.selected_plan || 'growth';
    const fullName     = session.user.user_metadata?.full_name || '';
    const userEmail    = session.user.email;

    console.log('ensureNewUserData: creating account for', userEmail, 'plan:', selectedPlan);

    await supabase.from('profiles').insert({
      id:        session.user.id,
      full_name: fullName,
      email:     userEmail,
      role:      'client',
    });

    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    let clientId = existingClient?.id || null;
    if (clientId) {
      console.log('ensureNewUserData: found existing client row, skipping insert:', clientId);
    }

    if (!clientId) {
      const { data: upsertData, error: upsertError } = await supabase
        .from('clients')
        .upsert(
          { name: fullName || userEmail, email: userEmail, plan: selectedPlan, active: true },
          { onConflict: 'email', ignoreDuplicates: false }
        )
        .select('id')
        .single();
      if (upsertError) {
        console.error('ensureNewUserData: clients upsert error:', upsertError);
      } else if (upsertData?.id) {
        clientId = upsertData.id;
        console.log('ensureNewUserData: client row created/updated via upsert:', clientId);
      }
    }

    // Path 2: upsert succeeded but SELECT policy (or network) blocked read-back —
    // try to recover the row by email lookup before giving up.
    if (!clientId) {
      const { data: retryData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      if (retryData?.id) {
        console.warn('Client row recovered via email lookup after initial insert failed');
        clientId = retryData.id;
      }
    }

    // Path 3: row truly missing — attempt a bare insert (no .select()) then look up again.
    if (!clientId) {
      await supabase
        .from('clients')
        .insert({ name: fullName || userEmail, email: userEmail, plan: selectedPlan, active: true });
      const { data: finalData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      if (finalData?.id) {
        clientId = finalData.id;
      }
    }

    if (clientId) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ client_id: clientId })
        .eq('id', session.user.id);
      if (profileUpdateError) {
        console.error('CRITICAL: Failed to link profile to client:', profileUpdateError);
      } else {
        console.log('ensureNewUserData: profile linked to client successfully:', clientId);
      }
      await ensureClientData(supabase, clientId);
    } else {
      console.error('CRITICAL: All registration paths failed for:', userEmail);
      try {
        await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'team@aiworldpartners.com',
            subject: 'CRITICAL: Failed signup - client row not created',
            text: 'User ' + userEmail + ' (auth ID: ' + session.user.id + ') signed up but client row was never created after all retries. Please fix manually in Supabase.'
          })
        });
      } catch (e) { console.error('Alert email failed:', e); }
    }

    // Re-fetch so the returned profile has client_id already linked
    return fetchProfile(session.user.id);
  }

  // ─── Core session handler ────────────────────────────────────────────────────
  //
  // This is the single function that resolves profile state for any authenticated
  // session. It is called from both the getSession() path and the deferred
  // SIGNED_IN path. The initializing/initialized guards ensure only one invocation
  // ever runs to completion regardless of which path fires first.

  async function handleSession(session) {
    if (initializing.current || initialized.current) return;
    initializing.current = true;

    try {
      let profileData = await fetchProfile(session.user.id);

      if (!profileData) {
        try {
          profileData = await ensureNewUserData(session);
        } catch (err) {
          console.error('Failed to create new user data on first login:', err);
          profileData = null;
        }
      }

      setProfile(profileData);
      if (profileData?.client_id) {
        initializeClientData(profileData.client_id);
      }
    } catch (err) {
      console.error('handleSession error:', err);
    } finally {
      // Always runs — guarantees loading clears and initialized is marked true
      setLoading(false);
      initialized.current = true;
    }
  }

  // ─── Effect ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Path A: check for an existing session on mount (safe — called outside any callback)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await handleSession(session);
      } else {
        // No session at all — nothing to do, just stop the spinner
        setLoading(false);
      }
    });

    // Path B: listen for auth state changes.
    //
    // IMPORTANT: do NOT call any supabase.from(...) directly inside this callback.
    // The Supabase JS v2 auth client holds an internal lock while firing these
    // events. Any supabase.from() call would internally call getSession() which
    // tries to acquire the same lock → deadlock → the promise never resolves.
    //
    // Rule: only synchronous state updates (setUser, setProfile, setLoading) are
    // allowed in the callback body. All async Supabase work is deferred via
    // setTimeout(..., 0) to escape the lock before any DB call is made.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION') return;

        if (event === 'TOKEN_REFRESHED') {
          if (session?.user) setUser(session.user);
          return;
        }

        if (event === 'SIGNED_IN') {
          if (session?.user) {
            setUser(session.user); // safe — synchronous only
            // Defer all DB work; handleSession's guard prevents double-execution
            // if Path A (getSession) already claimed the work.
            setTimeout(() => { handleSession(session); }, 0);
          }
          return;
        }

        if (event === 'USER_UPDATED') {
          if (session?.user) {
            setUser(session.user);
            // Defer the profile re-fetch to escape the auth lock
            setTimeout(async () => {
              try {
                const profileData = await fetchProfile(session.user.id);
                setProfile(profileData);
                if (profileData?.client_id) {
                  initializeClientData(profileData.client_id);
                }
              } catch (err) {
                console.error('USER_UPDATED profile re-fetch failed:', err);
              } finally {
                setLoading(false);
              }
            }, 0);
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          // Synchronous state reset — no Supabase calls needed
          setUser(null);
          setProfile(null);
          setLoading(false);
          initialized.current  = false;
          initializing.current = false;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ─── Auth actions ────────────────────────────────────────────────────────────

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    return { data };
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const value = { user, profile, loading, signIn, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
