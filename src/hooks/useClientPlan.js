import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function useClientPlan() {
  const { profile } = useAuth();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planLoaded, setPlanLoaded] = useState(false);

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
        setPlan(error ? 'growth' : (data?.plan || 'growth'));
        setPlanLoading(false);
        setPlanLoaded(true);
      });
  }, [profile?.client_id]);

  return { plan, planLoading, planLoaded };
}
