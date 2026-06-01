import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const ConfigStatusContext = createContext(null);

export function useConfigStatus() {
  return useContext(ConfigStatusContext);
}

export default function ConfigStatusProvider({ children }) {
  const { profile } = useAuth();
  const [dots, setDots] = useState([false, false, false, false, false]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const clientId = profile?.client_id;
    if (!clientId) return;
    if (loaded) return;

    Promise.all([
      supabase.from('client_settings').select('branding, pdf_content').eq('client_id', clientId).maybeSingle(),
      supabase.from('client_pricing').select('base_prices').eq('client_id', clientId).maybeSingle(),
      supabase.from('client_municipalities').select('id').eq('client_id', clientId).limit(1),
      supabase.from('client_questions').select('label_en').eq('client_id', clientId),
    ]).then(([{ data: s }, { data: p }, { data: m }, { data: q }]) => {
      setDots([
        !!(s?.branding?.company_name),
        !!(p?.base_prices && Object.values(p.base_prices).some(r => typeof r === 'object' && Object.values(r).some(v => Number(v) > 0))),
        !!(s?.pdf_content?.introduction),
        (m || []).length > 0,
        (q || []).some(x => x.label_en?.trim()),
      ]);
      setLoaded(true);
    }).catch(() => {});
  }, [profile?.client_id, loaded]);

  function refreshConfigStatus() {
    setLoaded(false);
  }

  return (
    <ConfigStatusContext.Provider value={{ dots, loaded, refreshConfigStatus }}>
      {children}
    </ConfigStatusContext.Provider>
  );
}
