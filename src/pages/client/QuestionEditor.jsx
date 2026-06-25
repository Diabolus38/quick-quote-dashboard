import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useConfigStatus } from '../../context/ConfigStatusContext';
import ClientLayout from '../../ClientLayout';
import TrialExpiredOverlay from '../../components/TrialExpiredOverlay';
import useClientPlan from '../../hooks/useClientPlan';
import UpgradeLock from '../../components/UpgradeLock';

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

const QUESTION_FLOW = {
  root:                   { label: 'Start',                      helper: '',                                             x: 450, y: 30,   children: [{ key: 'projectType',        branch: '' }] },
  projectType:            { label: 'Project Type',               helper: 'What type of project are you requesting?',     x: 450, y: 150,  children: [{ key: 'wastewaterType',     branch: 'New' }, { key: 'existingSystem', branch: 'Replacement' }] },
  wastewaterType:         { label: 'Wastewater Type',            helper: 'What type of wastewater system?',              x: 240, y: 270,  children: [{ key: 'propertyUsage',      branch: '' }] },
  existingSystem:         { label: 'Existing System',            helper: 'Describe the current system.',                 x: 660, y: 270,  children: [{ key: 'existingTankReusable', branch: '' }] },
  propertyUsage:          { label: 'Property Usage',             helper: 'How is the property primarily used?',          x: 240, y: 390,  children: [{ key: 'households',         branch: '' }] },
  existingTankReusable:   { label: 'Existing Tank Reusable',     helper: 'Can the existing tank be reused?',             x: 660, y: 390,  children: [{ key: 'tankInspectionRequired', branch: '' }] },
  households:             { label: 'Households',                 helper: 'How many households will be served?',          x: 240, y: 510,  children: [{ key: 'municipalityPlanning', branch: '' }] },
  tankInspectionRequired: { label: 'Tank Inspection Required',   helper: 'Does the tank require a formal inspection?',   x: 660, y: 510,  children: [{ key: 'municipalityPlanning', branch: '' }] },
  municipalityPlanning:   { label: 'Municipality Planning',      helper: 'Has municipality approval been obtained?',     x: 450, y: 630,  children: [{ key: 'municipality',       branch: '' }] },
  municipality:           { label: 'Municipality',               helper: 'Handled by your area configuration.',          x: 450, y: 750,  children: [{ key: 'installationType',   branch: '' }] },
  installationType:       { label: 'Installation Type',          helper: 'What type of installation is preferred?',      x: 450, y: 870,  children: [{ key: 'groundConditions',   branch: '' }] },
  groundConditions:       { label: 'Ground Conditions',          helper: 'Describe the ground conditions.',              x: 450, y: 990,  children: [{ key: 'pipeDepth',          branch: '' }] },
  pipeDepth:              { label: 'Pipe Depth',                 helper: 'What is the required pipe depth?',             x: 450, y: 1110, children: [{ key: 'excavationRequired', branch: '' }] },
  excavationRequired:     { label: 'Excavation Required',        helper: 'Will excavation be required?',                 x: 450, y: 1230, children: [{ key: 'transportHelp',      branch: '' }] },
  transportHelp:          { label: 'Transport Help',             helper: 'Is material transport assistance needed?',     x: 450, y: 1350, children: [{ key: 'additionalWork',     branch: '' }] },
  additionalWork:         { label: 'Additional Work',            helper: 'Any additional work beyond standard install?', x: 450, y: 1470, children: [] },
};

const EDITABLE_FLOW_KEYS = new Set(QUESTION_DEFS.map(d => d.key));

function makeDefault(key) {
  const flow = QUESTION_FLOW[key];
  return {
    question_key: key,
    visible:   true,
    label_en:  flow?.label  || '', label_sv: '', label_de: '', label_fr: '',
    helper_en: flow?.helper || '', helper_sv: '', helper_de: '', helper_fr: '',
  };
}

function useSaveMsg() {
  const [saveMsg, setSaveMsg] = useState('');
  function flash() { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000); }
  return [saveMsg, flash];
}

function ConfigStatusCard() {
  const { dots } = useConfigStatus();
  const navigate = useNavigate();
  const labels = ['Brand', 'Pricing', 'PDF', 'Areas', 'Questions'];
  const destinations = ['/client/settings', '/client/pricing', '/client/pdf', '/client/municipalities', '/client/questions'];
  const count = dots.filter(Boolean).length;
  const firstUndone = dots.findIndex(d => !d);
  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '16px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        {labels.map((label, i) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dots[i] ? '#16a34a' : '#e5e7eb' }} />
            <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: FONT }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontFamily: FONT }}>{count} of 5 sections configured</span>
        {count < 5 ? (
          <button type="button" onClick={() => navigate(destinations[firstUndone])}
            style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            Complete Setup →
          </button>
        ) : (
          <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '13px', fontFamily: FONT }}>✓ All set!</span>
        )}
      </div>
    </div>
  );
}

function getVisibleNodes(collapsedState) {
  const visible = new Set(['root']);
  const queue = ['root'];
  while (queue.length > 0) {
    const key = queue.shift();
    if (!collapsedState[key]) {
      (QUESTION_FLOW[key]?.children || []).forEach(({ key: childKey }) => {
        if (!visible.has(childKey)) { visible.add(childKey); queue.push(childKey); }
      });
    }
  }
  return visible;
}

const NODE_W = 180;
const NODE_H = 56;

function FlowMap({ questions, selectedKey, onSelectNode }) {
  const [pan,       setPan]       = useState({ x: 0, y: 0 });
  const [scale,     setScale]     = useState(0.65);
  const [collapsed, setCollapsed] = useState({});
  const dragging  = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const visibleNodes = getVisibleNodes(collapsed);

  const allEdges = [];
  Object.keys(QUESTION_FLOW).forEach(fromKey => {
    if (!collapsed[fromKey]) {
      QUESTION_FLOW[fromKey].children.forEach(({ key: toKey, branch }) => {
        if (visibleNodes.has(fromKey) && visibleNodes.has(toKey)) {
          allEdges.push({ from: fromKey, to: toKey, branch });
        }
      });
    }
  });

  function handleMouseDown(e) {
    if (e.target.closest('[data-node]')) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }
  function handleMouseMove(e) {
    if (!dragging.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x) * 0.55,
      y: dragStart.current.panY + (e.clientY - dragStart.current.y) * 0.55,
    });
  }
  function handleMouseUp() { dragging.current = false; }
  function handleWheel(e) {
    e.preventDefault();
    setScale(s => Math.min(2, Math.max(0.3, s - e.deltaY * 0.001)));
  }

  return (
    <div
      style={{ position: 'relative', height: '560px', overflow: 'hidden', backgroundColor: '#f8faf8', borderRadius: '12px', border: '1px solid #e8ede8', userSelect: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div style={{ position: 'absolute', transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '450px 280px', width: 900, height: 1580 }}>
        {/* SVG edges */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 900, height: 1580, pointerEvents: 'none', zIndex: 1 }}>
          {allEdges.map(({ from, to }) => {
            const fn = QUESTION_FLOW[from];
            const tn = QUESTION_FLOW[to];
            const x1 = fn.x + NODE_W / 2;
            const y1 = fn.y + NODE_H;
            const x2 = tn.x + NODE_W / 2;
            const y2 = tn.y;
            const ctrl = (y2 - y1) / 2;
            return (
              <path key={`${from}-${to}`}
                d={`M ${x1} ${y1} C ${x1} ${y1 + ctrl}, ${x2} ${y2 - ctrl}, ${x2} ${y2}`}
                fill="none" stroke="#d1d5db" strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Branch label pills */}
        {allEdges.map(({ from, to, branch }) => {
          if (!branch) return null;
          const fn = QUESTION_FLOW[from];
          const tn = QUESTION_FLOW[to];
          const midX = (fn.x + NODE_W / 2 + tn.x + NODE_W / 2) / 2;
          const midY = (fn.y + NODE_H + tn.y) / 2;
          return (
            <div key={`pill-${from}-${to}`} style={{ position: 'absolute', left: midX, top: midY, transform: 'translate(-50%, -50%)', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: '600', fontFamily: FONT, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 5 }}>
              {branch}
            </div>
          );
        })}

        {/* Nodes */}
        {Object.keys(QUESTION_FLOW).map(key => {
          if (!visibleNodes.has(key)) return null;
          const node = QUESTION_FLOW[key];
          const q = questions[key];
          const isRoot      = key === 'root';
          const isEditable  = !isRoot && EDITABLE_FLOW_KEYS.has(key);
          const isMuniOnly  = !isRoot && !EDITABLE_FLOW_KEYS.has(key);
          const label       = isEditable ? (q?.label_en || node.label) : node.label;
          const isSelected  = selectedKey === key;
          const hasChildren = node.children.length > 0;
          return (
            <div
              key={key}
              data-node="true"
              style={{
                position: 'absolute', left: node.x, top: node.y, width: NODE_W, height: NODE_H,
                backgroundColor: isRoot ? '#166534' : isMuniOnly ? '#f3f4f6' : isSelected ? '#ecfdf5' : '#ffffff',
                borderRadius: '12px',
                border: isRoot ? 'none' : isSelected ? `2px solid ${PRIMARY}` : '1px solid #e8ede8',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '6px 10px', cursor: isEditable ? 'pointer' : 'default', zIndex: 10, boxSizing: 'border-box',
              }}
              onClick={() => { if (isEditable) onSelectNode(key); }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: isRoot ? '#a3e635' : isMuniOnly ? '#9ca3af' : '#0d1117', fontFamily: FONT, textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
              {isEditable && q && !q.visible && (
                <div style={{ fontSize: '9px', color: '#dc2626', fontWeight: '600', fontFamily: FONT, marginTop: '2px' }}>Hidden</div>
              )}
              {hasChildren && (
                <button type="button" data-node="true"
                  onClick={e => { e.stopPropagation(); setCollapsed(c => ({ ...c, [key]: !c[key] })); }}
                  style={{ position: 'absolute', bottom: -9, right: -9, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#e5e7eb', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontWeight: '700', zIndex: 20, padding: 0 }}>
                  {collapsed[key] ? '+' : '−'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: '4px', zIndex: 20 }}>
        <button type="button" onClick={() => setScale(s => Math.min(2, s + 0.1))} style={{ width: 28, height: 28, borderRadius: '8px', border: '1px solid #e8ede8', backgroundColor: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>+</button>
        <button type="button" onClick={() => setScale(s => Math.max(0.3, s - 0.1))} style={{ width: 28, height: 28, borderRadius: '8px', border: '1px solid #e8ede8', backgroundColor: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>−</button>
        <button type="button" onClick={() => { setScale(0.65); setPan({ x: 0, y: 0 }); }} style={{ padding: '0 8px', height: 28, borderRadius: '8px', border: '1px solid #e8ede8', backgroundColor: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: '600', fontFamily: FONT, color: '#374151' }}>Reset</button>
      </div>
      <div style={{ position: 'absolute', top: 10, left: 12, fontSize: '11px', color: '#9ca3af', fontFamily: FONT, pointerEvents: 'none' }}>Click a node to edit · Drag to pan · Scroll to zoom</div>
    </div>
  );
}

function EditPanel({ nodeKey, questions, onUpdate, onClose }) {
  const node = QUESTION_FLOW[nodeKey] || {};
  const q    = questions[nodeKey]    || makeDefault(nodeKey);
  const [localLabel,   setLocalLabel]   = useState('');
  const [localHelper,  setLocalHelper]  = useState('');
  const [localVisible, setLocalVisible] = useState(true);

  useEffect(() => {
    setLocalLabel(q.label_en   || '');
    setLocalHelper(q.helper_en || '');
    setLocalVisible(q.visible  ?? true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey]);

  function handleApply() {
    onUpdate(nodeKey, 'label_en',  localLabel);
    onUpdate(nodeKey, 'helper_en', localHelper);
    onUpdate(nodeKey, 'visible',   localVisible);
    LANGS.forEach(({ code }) => {
      if (code === 'en') return;
      if (!q[`label_${code}`])  onUpdate(nodeKey, `label_${code}`,  localLabel);
      if (!q[`helper_${code}`]) onUpdate(nodeKey, `helper_${code}`, localHelper);
    });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', bottom: 0, left: '240px', right: 0, backgroundColor: '#fff', borderTop: '1px solid #e8ede8', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)', zIndex: 200, padding: '20px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto', minWidth: '120px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Editing</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{node.label || nodeKey}</div>
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT, marginBottom: '4px' }}>Label (EN)</div>
          <input type="text" value={localLabel} onChange={e => setLocalLabel(e.target.value)} maxLength={120}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', fontFamily: FONT }} />
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT, marginBottom: '4px' }}>Helper (EN)</div>
          <input type="text" value={localHelper} onChange={e => setLocalHelper(e.target.value)} maxLength={200}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', fontFamily: FONT }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT }}>Visible</div>
          <div onClick={() => setLocalVisible(v => !v)} style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: localVisible ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: localVisible ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button type="button" onClick={handleApply} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: PRIMARY, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT }}>Apply</button>
          <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: '#fff', color: '#374151', border: '1px solid #e8ede8', cursor: 'pointer', fontFamily: FONT }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function QuestionEditor() {
  const { profile } = useAuth();
  const clientId    = profile?.client_id;
  const { plan, planLoading } = useClientPlan();

  const [questions,         setQuestions]         = useState({});
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [saveMsg,           flashSave]            = useSaveMsg();
  const [error,             setError]             = useState('');
  const [hasChanges,        setHasChanges]        = useState(false);
  const [searchQ,           setSearchQ]           = useState('');
  const [viewMode,          setViewMode]          = useState('flowmap');
  const [previewLang,       setPreviewLang]       = useState('en');
  const [retryKey,          setRetryKey]          = useState(0);
  const [lastSavedQ,        setLastSavedQ]        = useState(() => localStorage.getItem(`qq360_last_saved_questions_${profile?.id || 'anon'}`) || '');
  const [resetBanner,       setResetBanner]       = useState(false);
  const [trialExpired,      setTrialExpired]      = useState(false);
  const [planEmailSent,     setPlanEmailSent]     = useState(false);
  const [installPreference, setInstallPreference] = useState(null);
  const [selectedNodeKey,   setSelectedNodeKey]   = useState(null);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('clients').select('plan, created_at, install_preference').eq('id', clientId).single()
      .then(({ data }) => { setInstallPreference(data?.install_preference || null); if (data?.plan === 'free_trial' && (Date.now() - new Date(data.created_at).getTime()) / 86400000 > 14) setTrialExpired(true); });
  }, [clientId]);

  async function sendPlanEmail(planName) {
    await fetch('https://estimator-widget-production.up.railway.app/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'team@aiworldpartners.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${clientId}.` }) }).catch(() => {});
    setPlanEmailSent(true);
  }

  /* ── Load ── */
  useEffect(() => {
    if (!clientId) return;
    async function load() {
      setLoading(true);
      setError('');
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
  }, [clientId, retryKey]);

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
    if (upsertErr) { setError('Failed to save. Please try again.'); } else { flashSave(); setHasChanges(false); const ts = new Date().toISOString(); localStorage.setItem(`qq360_last_saved_questions_${profile?.id || 'anon'}`, ts); setLastSavedQ(ts); }
  }

  const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '13px', color: '#0d1117', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', fontFamily: FONT };

  const SaveBar = ({ mt = false }) => (
    <div style={{ marginBottom: mt ? 0 : '28px', marginTop: mt ? '8px' : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button type="button" onClick={handleSave} disabled={saving}
          style={{ padding: '10px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', backgroundColor: saving ? '#9ca3af' : PRIMARY, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save All Questions'}
        </button>
        {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{saveMsg}</span>}
        {error   && <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500', fontFamily: FONT }}>{error}</span>}
      </div>
      {lastSavedQ && <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Last saved: {(() => { const d = new Date(lastSavedQ); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}</p>}
    </div>
  );

  if (planLoading) return (
    <>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ height: '16px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '80%', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </>
  );

  if (plan === 'starter') {
    return (
      <ClientLayout title="Questions">
        <UpgradeLock feature="Question Editor" requiredPlan="growth" />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Question Editor">
      <TrialExpiredOverlay trialExpired={trialExpired} planEmailSent={planEmailSent} sendPlanEmail={sendPlanEmail} clientId={clientId} installPreference={installPreference} />
      <ConfigStatusCard />
      <div style={{ fontFamily: FONT }}>

        {/* Page header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Question Editor</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Customize the labels and helper text for each estimator question.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            {[['flowmap', 'Flow Map'], ['list', 'Edit List'], ['preview', 'Preview']].map(([mode, modeLabel]) => (
              <button key={mode} type="button" onClick={() => { setViewMode(mode); if (mode !== 'flowmap') setSelectedNodeKey(null); }}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: viewMode === mode ? PRIMARY : '#fff', color: viewMode === mode ? '#fff' : '#374151', border: `1px solid ${viewMode === mode ? PRIMARY : '#e8ede8'}`, cursor: 'pointer', fontFamily: FONT }}>
                {modeLabel}
              </button>
            ))}
            <button type="button" onClick={() => {
              if (!window.confirm('Reset all questions to default labels? This will overwrite your custom labels.')) return;
              const reset = {};
              QUESTION_DEFS.forEach(({ key }) => { reset[key] = { ...(questions[key] || {}), label_en: '', label_sv: '', label_de: '', label_fr: '', helper_en: '', helper_sv: '', helper_de: '', helper_fr: '', visible: true }; });
              setQuestions(reset);
              setHasChanges(true);
              setResetBanner(true);
              setTimeout(() => setResetBanner(false), 4000);
            }}
              style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: '#fff', color: '#374151', border: '1px solid #e8ede8', cursor: 'pointer', fontFamily: FONT }}>
              Reset All
            </button>
          </div>
        </div>

        {resetBanner && (
          <div style={{ backgroundColor: '#fef9c3', color: '#854d0e', borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', fontFamily: FONT }}>
            Questions reset to defaults. Click Save All Questions to apply.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '14px' }}>Loading questions…</div>
        ) : error && Object.keys(questions).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontWeight: '500', fontFamily: FONT }}>{error}</p>
            <button type="button" onClick={() => setRetryKey(k => k + 1)}
              style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, marginTop: '12px' }}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* ── Flow Map view ── */}
            {viewMode === 'flowmap' && (
              <>
                <FlowMap questions={questions} selectedKey={selectedNodeKey} onSelectNode={setSelectedNodeKey} />
                {selectedNodeKey && (
                  <EditPanel nodeKey={selectedNodeKey} questions={questions} onUpdate={update} onClose={() => setSelectedNodeKey(null)} />
                )}
              </>
            )}

            {/* ── Edit List view ── */}
            {viewMode === 'list' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search questions..."
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 14px', height: '42px', fontSize: '13.5px', backgroundColor: '#fff', color: '#0d1117', outline: 'none', fontFamily: FONT }} />
                </div>
                <SaveBar />
                {QUESTION_DEFS.filter(({ label }) => !searchQ || label.toLowerCase().includes(searchQ.toLowerCase())).map(({ key, label }, idx) => {
                  const q = questions[key] || makeDefault(key);
                  return (
                    <div key={key} style={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '22px 24px', marginBottom: '14px' }}>

                      {/* Card header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{label}</span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#d1d5db', fontFamily: FONT }}>#{idx + 1}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* Per-question reset */}
                          <button type="button"
                            onClick={() => { const flow = QUESTION_FLOW[key]; update(key, 'label_en', flow?.label || ''); update(key, 'helper_en', flow?.helper || ''); }}
                            style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, padding: '4px 8px', borderRadius: '6px' }}
                            title="Reset to default">
                            ↺ Reset
                          </button>
                          {/* Visible toggle */}
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <div onClick={() => update(key, 'visible', !q.visible)}
                              style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: q.visible ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: q.visible ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                            </div>
                            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500', fontFamily: FONT }}>Visible</span>
                          </label>
                        </div>
                      </div>

                      {/* 4-column language grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        {LANGS.map(lang => (
                          <div key={lang.code} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>{lang.name}</div>
                              {lang.code !== 'en' && (
                                <span style={{ fontSize: '11px', color: '#9ca3af', cursor: 'pointer', fontFamily: FONT, userSelect: 'none' }}
                                  onClick={() => {
                                    setQuestions(prev => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        [`label_${lang.code}`]:  prev[key]?.label_en  || '',
                                        [`helper_${lang.code}`]: prev[key]?.helper_en || '',
                                      },
                                    }));
                                    setHasChanges(true);
                                  }}>
                                  Copy EN →
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT }}>Label</div>
                              <input type="text" placeholder={`Label in ${lang.name}`}
                                value={q[`label_${lang.code}`] || ''}
                                onChange={e => update(key, `label_${lang.code}`, e.target.value)}
                                maxLength={120}
                                style={inputStyle} />
                              <div style={{ fontSize: '10px', textAlign: 'right', marginTop: '2px', color: (q[`label_${lang.code}`] || '').length >= 120 ? '#dc2626' : (q[`label_${lang.code}`] || '').length >= 96 ? '#d97706' : '#9ca3af' }}>
                                {(q[`label_${lang.code}`] || '').length}/120
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT }}>Helper text</div>
                              <input type="text" placeholder={`Helper in ${lang.name}`}
                                value={q[`helper_${lang.code}`] || ''}
                                onChange={e => update(key, `helper_${lang.code}`, e.target.value)}
                                maxLength={200}
                                style={inputStyle} />
                              <div style={{ fontSize: '10px', textAlign: 'right', marginTop: '2px', color: (q[`helper_${lang.code}`] || '').length >= 200 ? '#dc2626' : (q[`helper_${lang.code}`] || '').length >= 160 ? '#d97706' : '#9ca3af' }}>
                                {(q[`helper_${lang.code}`] || '').length}/200
                              </div>
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

            {/* ── Preview view ── */}
            {viewMode === 'preview' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500', fontFamily: FONT }}>Preview language:</span>
                  {LANGS.map(lang => (
                    <button key={lang.code} type="button" onClick={() => setPreviewLang(lang.code)}
                      style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: '1px solid', borderColor: previewLang === lang.code ? PRIMARY : '#e8ede8', backgroundColor: previewLang === lang.code ? PRIMARY : '#fff', color: previewLang === lang.code ? '#fff' : '#374151', cursor: 'pointer', fontFamily: FONT }}>
                      {lang.name}
                    </button>
                  ))}
                </div>
                {QUESTION_DEFS.map(({ key, label }, idx) => {
                  const q = questions[key] || makeDefault(key);
                  const displayLabel  = q[`label_${previewLang}`]  || label;
                  const displayHelper = q[`helper_${previewLang}`] || '';
                  return (
                    <div key={key} style={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '18px 24px', marginBottom: '10px', opacity: q.visible ? 1 : 0.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: displayHelper ? '4px' : 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{displayLabel}</span>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#d1d5db', fontFamily: FONT }}>#{idx + 1}</span>
                          </div>
                          {displayHelper && <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>{displayHelper}</p>}
                        </div>
                        {!q.visible && (
                          <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b', padding: '3px 10px', borderRadius: '20px', flexShrink: 0, fontFamily: FONT }}>Hidden</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {hasChanges && viewMode !== 'preview' && !selectedNodeKey && (
              <div style={{ position: 'fixed', bottom: 0, left: '240px', right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e8ede8', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.06)', fontFamily: FONT }}>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>You have unsaved changes</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={handleSave} disabled={saving}
                    style={{ padding: '10px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', backgroundColor: saving ? '#9ca3af' : '#166534', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving…' : 'Save All Questions'}
                  </button>
                  <span style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: '600', fontFamily: FONT }}>
                    {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘S' : 'Ctrl+S'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}
