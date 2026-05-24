import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';

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
  { code: 'en', name: 'English' },
  { code: 'sv', name: 'Svenska' },
  { code: 'de', name: 'Deutsch' },
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

/* ── useSaveMsg hook ── */
function useSaveMsg() {
  const [saveMsg, setSaveMsg] = useState('');
  function flash() {
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }
  return [saveMsg, flash];
}

export default function QuestionEditor() {
  const { profile }  = useAuth();
  const clientId     = profile?.client_id;

  const [questions, setQuestions] = useState({});
  const [loading, setLoading]     = useState(true);
  const [saving,  setSaving]      = useState(false);
  const [saveMsg, flashSave]      = useSaveMsg();
  const [error,   setError]       = useState('');

  /* ── Load ── */
  useEffect(() => {
    if (!clientId) return;
    async function load() {
      setLoading(true);
      const { data, error: fetchErr } = await supabase
        .from('client_questions')
        .select('*')
        .eq('client_id', clientId);

      if (fetchErr) {
        setError('Failed to load questions.');
        setLoading(false);
        return;
      }

      // Merge DB data into defaults keyed by question_key
      const map = {};
      QUESTION_DEFS.forEach(({ key }) => { map[key] = makeDefault(key); });
      (data || []).forEach(row => {
        if (map[row.question_key]) {
          map[row.question_key] = { ...map[row.question_key], ...row };
        }
      });

      setQuestions(map);
      setLoading(false);
    }
    load();
  }, [clientId]);

  /* ── Update a single field on one question ── */
  function update(key, field, value) {
    setQuestions(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  /* ── Save all 14 rows via upsert ── */
  async function handleSave() {
    if (!clientId) return;
    setSaving(true);
    setError('');

    const rows = QUESTION_DEFS.map(({ key }) => ({
      client_id: clientId,
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
      .from('client_questions')
      .upsert(rows, { onConflict: 'client_id,question_key' });

    setSaving(false);
    if (upsertErr) {
      setError('Failed to save. Please try again.');
    } else {
      flashSave();
    }
  }

  /* ── Styles ── */
  const s = {
    sectionTitle: {
      fontSize: '14px', fontWeight: '700', color: '#111827',
      marginBottom: '20px',
    },
    saveBar: {
      display: 'flex', alignItems: 'center', gap: '14px',
      marginBottom: '28px',
    },
    saveBtn: {
      padding: '10px 28px', borderRadius: '8px',
      fontSize: '14px', fontWeight: '600',
      backgroundColor: saving ? '#6b7280' : '#111827',
      color: '#fff', border: 'none',
      cursor: saving ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit',
      opacity: saving ? 0.7 : 1,
    },
    savedText: {
      fontSize: '13px', color: '#16a34a', fontWeight: '600',
    },
    errorText: {
      fontSize: '13px', color: '#dc2626', fontWeight: '500',
    },
    card: {
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '16px',
    },
    cardHeader: {
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '14px', fontWeight: '700', color: '#111827',
    },
    cardIndex: {
      fontSize: '11px', fontWeight: '600', color: '#d1d5db',
      marginLeft: '8px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
    },
    langGroup: {
      display: 'flex', flexDirection: 'column', gap: '10px',
    },
    langLabel: {
      fontSize: '11px', fontWeight: '700', color: '#9ca3af',
      textTransform: 'uppercase', letterSpacing: '0.5px',
      marginBottom: '6px',
    },
    inputGroup: {
      display: 'flex', flexDirection: 'column', gap: '6px',
    },
    fieldLabel: {
      fontSize: '11px', color: '#6b7280', fontWeight: '500',
    },
    input: {
      width: '100%', padding: '8px 10px',
      fontSize: '13px', color: '#111827',
      border: '1px solid #e5e7eb', borderRadius: '6px',
      outline: 'none', boxSizing: 'border-box',
      backgroundColor: '#f9fafb', fontFamily: 'inherit',
    },
    toggleWrapper: {
      display: 'flex', alignItems: 'center', gap: '8px',
    },
    toggleLabel: {
      fontSize: '13px', color: '#374151', fontWeight: '500',
    },
    divider: {
      border: 'none', borderTop: '1px solid #f0f0f0',
      margin: '16px 0',
    },
  };

  return (
    <ClientLayout title="Question Editor">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '15px' }}>
          Loading questions…
        </div>
      ) : (
        <>
          {/* Save bar */}
          <div style={s.saveBar}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={s.saveBtn}
            >
              {saving ? 'Saving…' : 'Save All Questions'}
            </button>
            {saveMsg && <span style={s.savedText}>{saveMsg}</span>}
            {error   && <span style={s.errorText}>{error}</span>}
          </div>

          {/* Question cards */}
          {QUESTION_DEFS.map(({ key, label }, idx) => {
            const q = questions[key] || makeDefault(key);
            return (
              <div key={key} style={s.card}>
                {/* Card header: title + visible toggle */}
                <div style={s.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={s.cardTitle}>{label}</span>
                    <span style={s.cardIndex}>#{idx + 1}</span>
                  </div>

                  {/* Visible toggle */}
                  <label style={s.toggleWrapper}>
                    <input
                      type="checkbox"
                      checked={q.visible}
                      onChange={e => update(key, 'visible', e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#111827' }}
                    />
                    <span style={s.toggleLabel}>Visible</span>
                  </label>
                </div>

                {/* 4-column grid: one col per language */}
                <div style={{ ...s.grid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {LANGS.map(lang => (
                    <div key={lang.code} style={s.langGroup}>
                      <div style={s.langLabel}>{lang.name}</div>

                      <div style={s.inputGroup}>
                        <div style={s.fieldLabel}>Label</div>
                        <input
                          type="text"
                          placeholder={`Label in ${lang.name}`}
                          value={q[`label_${lang.code}`] || ''}
                          onChange={e => update(key, `label_${lang.code}`, e.target.value)}
                          style={s.input}
                        />
                      </div>

                      <div style={s.inputGroup}>
                        <div style={s.fieldLabel}>Helper text</div>
                        <input
                          type="text"
                          placeholder={`Helper in ${lang.name}`}
                          value={q[`helper_${lang.code}`] || ''}
                          onChange={e => update(key, `helper_${lang.code}`, e.target.value)}
                          style={s.input}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Bottom save bar */}
          <div style={{ ...s.saveBar, marginTop: '8px', marginBottom: '0' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={s.saveBtn}
            >
              {saving ? 'Saving…' : 'Save All Questions'}
            </button>
            {saveMsg && <span style={s.savedText}>{saveMsg}</span>}
            {error   && <span style={s.errorText}>{error}</span>}
          </div>
        </>
      )}
    </ClientLayout>
  );
}
