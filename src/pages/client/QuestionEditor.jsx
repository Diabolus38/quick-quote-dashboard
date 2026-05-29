import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

/* ── The 14 standard question keys ── */
const QUESTION_DEFS = [
  { key: 'projectType',            label: 'Project Type'              },
  { key: 'wastewaterType',         label: 'Wastewater Type'           },
  { key: 'propertyUsage',          label: 'Property Usage'            },
  { key: 'households',             label: 'Households'                },
  { key: 'existingSystem',         label: 'Existing System'           },
  { key: 'existingTankReusable',   label: 'Existing Tank Reusable'   },
  { key: 'tankInspectionRequired', label: 'Tank Inspection Required'  },
  { key: 'municipalityPlanning',   label: 'Municipality Planning'     },
  { key: 'installationType',       label: 'Installation Type'         },
  { key: 'groundConditions',       label: 'Ground Conditions'         },
  { key: 'pipeDepth',              label: 'Pipe Depth'                },
  { key: 'excavationRequired',     label: 'Excavation Required'       },
  { key: 'transportHelp',          label: 'Transport Help'            },
  { key: 'additionalWork',         label: 'Additional Work'           },
];

const LANGS = [
  { code: 'en', name: 'English'  },
  { code: 'sv', name: 'Svenska'  },
  { code: 'de', name: 'Deutsch'  },
  { code: 'fr', name: 'Français' },
];

function makeDefault(key) {
  return {
    question_key: key,
    visible: true,
    label_en: '', label_sv: '', label_de: '', label_fr: '',
    helper_en: '', helper_sv: '', helper_de: '', helper_fr: '',
  };
}

function useSaveMsg() {
  const [saveMsg, setSaveMsg] = useState('');
  function flash() { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000); }
  return [saveMsg, flash];
}

export default function QuestionEditor() {
  const { profile } = useAuth();
  const clientId    = profile?.client_id;

  const [questions,   setQuestions]   = useState({});
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     flashSave]      = useSaveMsg();
  const [error,       setError]       = useState('');
  const [hasChanges,  setHasChanges]  = useState(false);

  /* ── Load ── */
  useEffect(() => {
    if (!clientId) return;
    async function load() {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('client_questions').select('*').eq('client_id', clientId);
      if (fetchErr) { setError('Failed to load questions.'); setLoading(false); return; }
      const map = {};
      QUESTION_DEFS.forEach(({ key }) => { map[key] = makeDefault(key); });
      (data || []).forEach(row => { if (map[row.question_key]) map[row.question_key] = { ...map[row.question_key], ...row }; });
      setQuestions(map);
      setLoading(false);
    }
    load();
  }, [clientId]);

  /* ── Update a single field ── */
  function update(key, field, value) {
    setQuestions(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    setHasChanges(true);
  }

  /* ── Save all 14 rows via upsert ── */
  async function handleSave() {
    if (!clientId) return;
    setSaving(true);
    setError('');
    const rows = QUESTION_DEFS.map(({ key }) => ({
      client_id:    clientId,
      question_key: key,
      visible:   questions[key]?.visible   ?? true,
      label_en:  questions[key]?.label_en  ?? '',
      label_sv:  questions[key]?.label_sv  ?? '',
      label_de:  questions[key]?.label_de  ?? '',
      label_fr:  questions[key]?.label_fr  ?? '',
      helper_en: questions[key]?.helper_en ?? '',
      helper_sv: questions[key]?.helper_sv ?? '',
      helper_de: questions[key]?.helper_de ?? '',
      helper_fr: questions[key]?.helper_fr ?? '',
    }));
    const { error: upsertErr } = await supabase
      .from('client_questions').upsert(rows, { onConflict: 'client_id,question_key' });
    setSaving(false);
    if (upsertErr) { setError('Failed to save. Please try again.'); } else { flashSave(); setHasChanges(false); }
  }

  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', color: '#0d1117', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontFamily: FONT };

  const SaveBar = ({ mt = false }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: mt ? 0 : '28px', marginTop: mt ? '8px' : 0 }}>
      <button type="button" onClick={handleSave} disabled={saving}
        style={{ padding: '10px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', backgroundColor: saving ? '#9ca3af' : PRIMARY, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : 'Save All Questions'}
      </button>
      {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{saveMsg}</span>}
      {error   && <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500', fontFamily: FONT }}>{error}</span>}
    </div>
  );

  return (
    <ClientLayout title="Question Editor">
      {hasChanges && (
        <div style={{ position: 'fixed', bottom: 0, left: '240px', right: 0, backgroundColor: '#fff', borderTop: '1px solid #e8ede8', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '13.5px', color: '#9ca3af', fontFamily: FONT }}>You have unsaved changes</span>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ padding: '10px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', backgroundColor: saving ? '#9ca3af' : PRIMARY, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save All Questions'}
          </button>
        </div>
      )}
      <div style={{ fontFamily: FONT }}>

        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Question Editor</h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Customize the labels and helper text for each estimator question.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '14px' }}>Loading questions…</div>
        ) : (
          <>
            <SaveBar />

            {QUESTION_DEFS.map(({ key, label }, idx) => {
              const q = questions[key] || makeDefault(key);
              return (
                <div key={key} style={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '22px 24px', marginBottom: '14px' }}>

                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{label}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#d1d5db', fontFamily: FONT }}>#{idx + 1}</span>
                    </div>

                    {/* Visible toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <div onClick={() => update(key, 'visible', !q.visible)}
                        style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: q.visible ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: q.visible ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                      </div>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500', fontFamily: FONT }}>Visible</span>
                    </label>
                  </div>

                  {/* 4-column language grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {LANGS.map(lang => (
                      <div key={lang.code} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT, marginBottom: '2px' }}>{lang.name}</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT }}>Label</div>
                          <input type="text" placeholder={`Label in ${lang.name}`}
                            value={q[`label_${lang.code}`] || ''}
                            onChange={e => update(key, `label_${lang.code}`, e.target.value)}
                            style={inputStyle} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT }}>Helper text</div>
                          <input type="text" placeholder={`Helper in ${lang.name}`}
                            value={q[`helper_${lang.code}`] || ''}
                            onChange={e => update(key, `helper_${lang.code}`, e.target.value)}
                            style={inputStyle} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <SaveBar mt />
          </>
        )}
      </div>
    </ClientLayout>
  );
}
