import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'qq360_client_plan';

export default function useClientPlan() {
  const { profile } = useAuth();

  const cached = sessionStorage.getItem(CACHE_KEY);
  const [plan, setPlan] = useState(cached || null);
  const [planLoading, setPlanLoading] = useState(!cached);
  const [planLoaded, setPlanLoaded] = useState(!!cached);

  useEffect(() => {
    if (!profile?.client_id) {
      setPlanLoading(false);
      setPlanLoaded(true);
      return;
    }

    supabase
      .from('clients')
      .select('plan, created_at')
      .eq('id', profile.client_id)
      .single()
      .then(({ data, error }) => {
        const fetched = error ? 'growth' : (data?.plan || 'growth');
        sessionStorage.setItem(CACHE_KEY, fetched);
        setPlan(fetched);
        setPlanLoading(false);
        setPlanLoaded(true);
      });
  }, [profile?.client_id]);

  return { plan, planLoading, planLoaded };
}
