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

const QUESTION_FLOW = [
  { key: 'municipality',           num: 'Q1',  label: 'Which municipality do you live in?',              helper: 'Type your municipality name.',                          type: 'text',   options: [] },
  { key: 'residenceType',          num: 'Q2',  label: 'How is the property used?',                       helper: 'This helps us size the system correctly.',              type: 'choice', options: [{ value: 'permanent', label: 'Permanent residence' }, { value: 'holiday_home', label: 'Holiday home' }, { value: 'complementary_house', label: 'Complementary house' }] },
  { key: 'households',             num: 'Q3',  label: 'How many households will use the system?',         helper: 'Projects above 5 are handled separately.',              type: 'choice', options: [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }, { value: '5', label: '5' }] },
  { key: 'protectionClass',        num: 'Q4',  label: 'What is the protection class in your area?',      helper: 'Check with your municipality if unsure.',               type: 'choice', options: [{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'not_sure', label: 'Not sure' }] },
  { key: 'installationType',       num: 'Q5',  label: 'How should the system be installed?',             helper: 'Different methods suit different ground conditions.',    type: 'choice', options: [{ value: 'underground', label: 'Underground' }, { value: 'above_ground', label: 'Above ground' }, { value: 'not_sure', label: 'Not sure' }] },
  { key: 'existingSystem',         num: 'Q6',  label: 'What system exists on the property today?',       helper: 'This affects removal and installation costs.',           type: 'choice', options: [{ value: 'none', label: 'None' }, { value: 'three_chamber_well', label: 'Three-chamber well' }, { value: 'closed_tank', label: 'Closed tank' }, { value: 'bdt_greywater', label: 'BDT / Greywater' }, { value: 'mini_treatment_plant', label: 'Mini treatment plant' }] },
  { key: 'canReuseExisting',       num: 'Q7',  label: 'Can the existing system be reused?',              helper: 'A reusable system can reduce costs significantly.',      type: 'choice', conditional: 'if existingSystem is three_chamber_well, closed_tank, or bdt_greywater', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: 'Not sure' }] },
  { key: 'systemType',             num: 'Q8',  label: 'Which system are you interested in?',             helper: 'This determines the main components and pricing.',       type: 'choice', options: [{ value: 'bdt_only', label: 'BDT only' }, { value: 'wc_only', label: 'WC only' }, { value: 'wc_bdt', label: 'WC + BDT' }] },
  { key: 'newPipes',               num: 'Q9',  label: 'Do new pipes need to be laid from the house?',    helper: 'This affects excavation and material costs.',           type: 'choice', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { key: 'newPipesLength',         num: 'Q10', label: 'How many meters of new pipe?',                    helper: 'Enter the distance from house to the system location.', type: 'number', conditional: 'if newPipes is yes', options: [] },
  { key: 'excavationOutlet',       num: 'Q11', label: 'Is excavation needed for the outlet pipe?',       helper: 'Required if the outlet pipe is buried.',                type: 'choice', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { key: 'excavationOutletLength', num: 'Q12', label: 'How many meters for the outlet pipe excavation?', helper: 'Enter the length of the outlet trench.',                type: 'number', conditional: 'if excavationOutlet is yes', options: [] },
  { key: 'lawnRestoration',        num: 'Q13', label: 'Is lawn restoration needed?',                     helper: 'We restore the lawn after installation.',               type: 'choice', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { key: 'massRemoval',            num: 'Q14', label: 'Is removal of excavated masses needed?',          helper: 'We remove and dispose of excavated earth.',             type: 'choice', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { key: 'transport',              num: 'Q15', label: 'Do you need help with transport of materials?',   helper: 'We can arrange delivery to your plot.',                 type: 'choice', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { key: 'notes',                  num: 'Q16', label: 'Any additional information?',                     helper: 'Optional. Add any details that may affect the estimate.', type: 'text', options: [] },
  { key: 'contactStep',            num: 'Q17', label: 'Contact details',                                 helper: 'Customer fills in name, email, phone, company.',        type: 'form',   options: [] },
];

const QUESTION_FLOW_MAP = Object.fromEntries(QUESTION_FLOW.map(q => [q.key, q]));

const NODE_COL_W = 260;
const NODE_W     = 200;
const NODE_H_EST = 120;

const NODE_POSITIONS = {};
QUESTION_FLOW.forEach((node, i) => {
  NODE_POSITIONS[node.key] = { x: i * NODE_COL_W, y: node.conditional ? 380 : 200 };
});

const COND_BRANCHES = [
  { parent: 'existingSystem',   cond: 'canReuseExisting',       rejoin: 'systemType',       label: 'if reusable' },
  { parent: 'newPipes',         cond: 'newPipesLength',          rejoin: 'excavationOutlet', label: 'if yes' },
  { parent: 'excavationOutlet', cond: 'excavationOutletLength',  rejoin: 'lawnRestoration',  label: 'if yes' },
];

function makeDefault(key) {
  const flow = QUESTION_FLOW_MAP[key];
  return {
    question_key: key,
    visible:   true,
    label_en:  flow?.label  || '',
    helper_en: flow?.helper || '',
    label_sv: '', label_de: '', label_fr: '',
    helper_sv: '', helper_de: '', helper_fr: '',
  };
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

const TYPE_LABELS = { text: 'TEXT', choice: 'CHOICE', number: 'NUMBER', form: 'FORM' };

function FlowMap({ questions, editNodeKey, onSelectNode }) {
  const [pan,        setPan]        = useState({ x: 40, y: 60 });
  const [scale,      setScale]      = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const mainFlowNodes = QUESTION_FLOW.filter(n => !n.conditional);

  const handleMouseDown = (e) => {
    if (e.target.closest('[data-node]')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x) * 0.5,
      y: dragStart.current.panY + (e.clientY - dragStart.current.y) * 0.5,
    });
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel  = (e) => {
    e.preventDefault();
    setScale(s => Math.min(1.5, Math.max(0.3, s - e.deltaY * 0.001)));
  };

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;

  /* ── edge geometry helpers ── */
  const mainY   = 200 + NODE_H_EST / 2;   // vertical center of main-flow nodes
  const condY   = 380 + NODE_H_EST / 2;   // vertical center of conditional nodes
  const mainBot = 200 + NODE_H_EST;        // bottom of main-flow nodes (approx)

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '580px', backgroundColor: '#f8faf8', borderRadius: '16px', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* ── world: SVG edges + node cards share one transform ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, transformOrigin: '0 0', transform, width: '5000px', height: '800px' }}>

        {/* SVG edge layer */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '5000px', height: '800px', pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <marker id="arr-main" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#d1d5db" />
            </marker>
            <marker id="arr-cond" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill="#86efac" />
            </marker>
          </defs>

          {/* Main flow horizontal edges */}
          {mainFlowNodes.slice(0, -1).map((n, i) => {
            const next = mainFlowNodes[i + 1];
            const fp   = NODE_POSITIONS[n.key];
            const tp   = NODE_POSITIONS[next.key];
            const x1   = fp.x + NODE_W;
            const x2   = tp.x;
            const cx   = (x1 + x2) / 2;
            return (
              <path key={`main-${n.key}`}
                d={`M ${x1} ${mainY} C ${cx} ${mainY}, ${cx} ${mainY}, ${x2} ${mainY}`}
                fill="none" stroke="#d1d5db" strokeWidth="1.5" markerEnd="url(#arr-main)"
              />
            );
          })}

          {/* Conditional branch edges */}
          {COND_BRANCHES.map(({ parent, cond, rejoin, label }) => {
            const pp = NODE_POSITIONS[parent];
            const cp = NODE_POSITIONS[cond];
            const rp = NODE_POSITIONS[rejoin];
            const pCx = pp.x + NODE_W / 2;
            const cCx = cp.x + NODE_W / 2;
            const rX  = rp.x;

            /* parent bottom-center → conditional top-center */
            const d1y1 = mainBot;
            const d1y2 = 380;
            const d1cx = (pCx + cCx) / 2;
            const d1cy = (d1y1 + d1y2) / 2;

            /* conditional right-center → rejoin left-center */
            const d2x1 = cp.x + NODE_W;
            const d2cx = (d2x1 + rX) / 2;

            /* midpoints for labels */
            const lx = d1cx;
            const ly = d1cy - 8;
            const lx2 = d2cx;
            const ly2 = (condY + mainY) / 2;

            return (
              <g key={`cond-${cond}`}>
                <path d={`M ${pCx} ${d1y1} C ${pCx} ${d1cy}, ${cCx} ${d1cy}, ${cCx} ${d1y2}`}
                  fill="none" stroke="#86efac" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr-cond)" />
                <path d={`M ${d2x1} ${condY} C ${d2cx} ${condY}, ${d2cx} ${mainY}, ${rX} ${mainY}`}
                  fill="none" stroke="#86efac" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr-cond)" />
                <rect x={lx - 22} y={ly - 9} width="44" height="16" rx="8" fill="#f0fdf4" />
                <text x={lx} y={ly + 3} textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534" fontFamily={FONT}>{label}</text>
                <rect x={lx2 - 22} y={ly2 - 9} width="44" height="16" rx="8" fill="#f0fdf4" />
                <text x={lx2} y={ly2 + 3} textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534" fontFamily={FONT}>rejoins</text>
              </g>
            );
          })}
        </svg>

        {/* Node cards */}
        {QUESTION_FLOW.map(node => {
          const pos       = NODE_POSITIONS[node.key];
          const q         = questions[node.key];
          const label     = q?.label_en || node.label;
          const isSelected = editNodeKey === node.key;
          const isHidden  = q?.visible === false;
          const pills     = node.options.slice(0, 4);
          const extra     = node.options.length - 4;

          return (
            <div
              key={node.key}
              data-node="true"
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: NODE_W,
                backgroundColor: node.conditional ? '#fafff9' : '#fff',
                border: `1.5px ${node.conditional ? 'dashed' : 'solid'} ${isSelected ? PRIMARY : '#e8ede8'}`,
                borderRadius: '14px',
                padding: '12px 14px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                opacity: isHidden ? 0.4 : 1,
                boxShadow: isSelected ? `0 0 0 3px rgba(22,101,52,.1), 0 2px 8px rgba(0,0,0,.06)` : '0 2px 6px rgba(0,0,0,0.06)',
                zIndex: 10,
              }}
              onClick={() => onSelectNode(node.key)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: '700', fontFamily: FONT }}>{node.num}</span>
                <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', borderRadius: '20px', padding: '2px 7px', fontSize: '10px', fontWeight: '600', fontFamily: FONT }}>{TYPE_LABELS[node.type]}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#0d1117', fontFamily: FONT, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{label}</div>
              {pills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '6px' }}>
                  {pills.map(opt => (
                    <span key={opt.value} style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: '10px', borderRadius: '20px', padding: '1px 7px', fontFamily: FONT }}>{opt.label}</span>
                  ))}
                  {extra > 0 && <span style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', fontSize: '10px', borderRadius: '20px', padding: '1px 7px', fontFamily: FONT }}>+{extra} more</span>}
                </div>
              )}
              {node.conditional && (
                <div style={{ fontSize: '10px', color: '#9ca3af', fontStyle: 'italic', fontFamily: FONT, marginTop: '5px', lineHeight: 1.3 }}>{node.conditional}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: '4px', zIndex: 20 }}>
        <button type="button" data-node="true" onClick={() => setScale(s => Math.min(1.5, s + 0.1))} style={{ width: 28, height: 28, borderRadius: '8px', border: '1px solid #e8ede8', backgroundColor: '#fff', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>+</button>
        <button type="button" data-node="true" onClick={() => setScale(s => Math.max(0.3, s - 0.1))} style={{ width: 28, height: 28, borderRadius: '8px', border: '1px solid #e8ede8', backgroundColor: '#fff', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>−</button>
        <button type="button" data-node="true" onClick={() => { setScale(0.85); setPan({ x: 40, y: 60 }); }} style={{ width: 28, height: 28, borderRadius: '8px', border: '1px solid #e8ede8', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌂</button>
      </div>
      <div style={{ position: 'absolute', top: 10, left: 12, fontSize: '11px', color: '#9ca3af', fontFamily: FONT, pointerEvents: 'none', zIndex: 20 }}>Click node to edit · Drag to pan · Scroll to zoom</div>
    </div>
  );
}

function EditPanel({ nodeKey, questions, onSave, onClose, clientId }) {
  const node = QUESTION_FLOW_MAP[nodeKey] || {};
  const q    = questions[nodeKey] || makeDefault(nodeKey);

  const [localLabel,   setLocalLabel]   = useState('');
  const [localHelper,  setLocalHelper]  = useState('');
  const [localVisible, setLocalVisible] = useState(true);
  const [btnMsg,       setBtnMsg]       = useState('');

  useEffect(() => {
    setLocalLabel(q.label_en   || node.label  || '');
    setLocalHelper(q.helper_en || node.helper || '');
    setLocalVisible(q.visible  ?? true);
    setBtnMsg('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey]);

  async function handleSave() {
    if (btnMsg) return;
    onSave(nodeKey, localLabel, localHelper, localVisible);
    setBtnMsg('Saving…');

    const { error } = await supabase.from('client_questions').upsert({
      client_id:    clientId,
      question_key: nodeKey,
      label_en:     localLabel,
      helper_en:    localHelper,
      label_sv:     localLabel,
      label_de:     localLabel,
      label_fr:     localLabel,
      helper_sv:    localHelper,
      helper_de:    localHelper,
      helper_fr:    localHelper,
      visible:      localVisible,
    }, { onConflict: 'client_id,question_key' });
    if (error) { console.error('Failed to save question:', error); setBtnMsg(''); return; }

    setBtnMsg('Translating…');
    try {
      const singleApiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Translate this wastewater estimator question label and helper text to Swedish (sv), German (de), and French (fr). Return ONLY valid JSON, no markdown.\n\nlabel_en: "${localLabel}"\nhelper_en: "${localHelper}"\n\nReturn: {"label_sv":"...","label_de":"...","label_fr":"...","helper_sv":"...","helper_de":"...","helper_fr":"..."}`,
          }],
        }),
      });
      const singleData = await singleApiResponse.json();
      const singleRaw = singleData.content?.[0]?.text || '{}';
      const singleTranslations = JSON.parse(singleRaw.replace(/```json|```/g, '').trim());
      await supabase.from('client_questions').upsert({
        client_id:    clientId,
        question_key: nodeKey,
        label_sv:  singleTranslations.label_sv  || localLabel,
        label_de:  singleTranslations.label_de  || localLabel,
        label_fr:  singleTranslations.label_fr  || localLabel,
        helper_sv: singleTranslations.helper_sv || localHelper,
        helper_de: singleTranslations.helper_de || localHelper,
        helper_fr: singleTranslations.helper_fr || localHelper,
      }, { onConflict: 'client_id,question_key' });
    } catch (err) {
      console.error('Translation failed:', err);
    }

    setBtnMsg('Saved in 4 languages ✓');
    setTimeout(() => { setBtnMsg(''); onClose(); }, 2000);
  }

  return (
    <div style={{ position: 'fixed', bottom: 0, left: '240px', right: 0, backgroundColor: '#fff', borderTop: '1.5px solid #e8ede8', borderRadius: '16px 16px 0 0', boxShadow: '0 -4px 24px rgba(0,0,0,.1)', zIndex: 50, padding: '18px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{node.num}: {node.label}</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af', lineHeight: 1, padding: '0 4px' }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '190px' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT, marginBottom: '4px' }}>Question text</div>
          <input type="text" value={localLabel} onChange={e => setLocalLabel(e.target.value)} maxLength={160}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', fontFamily: FONT }} />
        </div>
        <div style={{ flex: 1, minWidth: '190px' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT, marginBottom: '4px' }}>Helper text</div>
          <input type="text" value={localHelper} onChange={e => setLocalHelper(e.target.value)} maxLength={200}
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', fontFamily: FONT }} />
        </div>
        {node.options && node.options.length > 0 && (
          <div style={{ flex: '0 0 auto', maxWidth: '260px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT, marginBottom: '4px' }}>Answer options</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
              {node.options.map(opt => (
                <span key={opt.value} style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: '11px', borderRadius: '20px', padding: '2px 8px', fontFamily: FONT }}>{opt.label}</span>
              ))}
            </div>
            <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: FONT }}>Answer options are defined in the tool and cannot be changed.</div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT }}>Visible</div>
          <div onClick={() => setLocalVisible(v => !v)} style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: localVisible ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: localVisible ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: 'transparent', fontFamily: FONT }}>.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={handleSave}
              style={{ padding: '8px 20px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: btnMsg ? '#16a34a' : PRIMARY, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT, transition: 'background-color 0.2s', minWidth: '80px' }}>
              {btnMsg || 'Save'}
            </button>
            <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Changes save to tool automatically</span>
          </div>
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
  const [saveMsg,           setSaveMsg]           = useState('');
  const [error,             setError]             = useState('');
  const [hasChanges,        setHasChanges]        = useState(false);
  const [viewMode,          setViewMode]          = useState('flowmap');
  const [retryKey,          setRetryKey]          = useState(0);
  const [resetBanner,       setResetBanner]       = useState(false);
  const [trialExpired,      setTrialExpired]      = useState(false);
  const [planEmailSent,     setPlanEmailSent]     = useState(false);
  const [installPreference, setInstallPreference] = useState(null);
  const [editNodeKey,       setEditNodeKey]       = useState(null);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('clients').select('plan, created_at, install_preference').eq('id', clientId).single()
      .then(({ data }) => {
        setInstallPreference(data?.install_preference || null);
        if (data?.plan === 'free_trial' && (Date.now() - new Date(data.created_at).getTime()) / 86400000 > 14) setTrialExpired(true);
      });
  }, [clientId]);

  async function sendPlanEmail(planName) {
    await fetch('https://estimator-widget-production.up.railway.app/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'team@aiworldpartners.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${clientId}.` }),
    }).catch(() => {});
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
      QUESTION_FLOW.forEach(({ key }) => { map[key] = makeDefault(key); });
      (data || []).forEach(row => { if (map[row.question_key]) map[row.question_key] = { ...map[row.question_key], ...row }; });
      setQuestions(map);
      setLoading(false);
    }
    load();
  }, [clientId, retryKey]);

  function update(key, field, value) {
    setQuestions(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    setHasChanges(true);
  }

  function handleEditSave(key, labelEn, helperEn, visible) {
    setQuestions(prev => ({ ...prev, [key]: { ...prev[key], label_en: labelEn, helper_en: helperEn, visible } }));
    setHasChanges(true);
  }

  /* ── Save all rows via upsert, then translate sv/de/fr via Anthropic ── */
  async function handleSave() {
    if (!clientId) return;
    setSaving(true);
    setError('');
    const rows = QUESTION_FLOW.map(({ key }) => {
      const q = questions[key] || makeDefault(key);
      return {
        client_id:    clientId,
        question_key: key,
        visible:   q.visible   ?? true,
        label_en:  q.label_en  || '',
        helper_en: q.helper_en || '',
        label_sv:  q.label_sv  || q.label_en  || '',
        label_de:  q.label_de  || q.label_en  || '',
        label_fr:  q.label_fr  || q.label_en  || '',
        helper_sv: q.helper_sv || q.helper_en || '',
        helper_de: q.helper_de || q.helper_en || '',
        helper_fr: q.helper_fr || q.helper_en || '',
      };
    });
    const { error: upsertErr } = await supabase
      .from('client_questions').upsert(rows, { onConflict: 'client_id,question_key' });
    if (upsertErr) {
      setSaving(false);
      setError('Failed to save. Please try again.');
      return;
    }
    setHasChanges(false);
    setSaveMsg('Saved! Translating to all languages...');
    try {
      const toTranslate = rows.filter(r => r.label_en && r.label_en.trim());
      if (toTranslate.length > 0) {
        const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 4000,
            messages: [{ role: 'user', content: 'Translate these wastewater estimator questions to Swedish (sv), German (de), and French (fr). Return ONLY a JSON array, no markdown.\n\nInput: ' + JSON.stringify(toTranslate.map(q => ({ key: q.question_key, label: q.label_en, helper: q.helper_en }))) + '\n\nReturn: [{"key":"...","label_sv":"...","label_de":"...","label_fr":"...","helper_sv":"...","helper_de":"...","helper_fr":"..."}]' }]
          })
        });
        const apiData = await apiRes.json();
        const raw = (apiData.content?.[0]?.text || '[]').replace(/```json|```/g, '').trim();
        const translations = JSON.parse(raw);
        if (Array.isArray(translations) && translations.length > 0) {
          await supabase.from('client_questions').upsert(
            translations.map(t => ({ client_id: clientId, question_key: t.key, label_sv: t.label_sv || '', label_de: t.label_de || '', label_fr: t.label_fr || '', helper_sv: t.helper_sv || '', helper_de: t.helper_de || '', helper_fr: t.helper_fr || '' })),
            { onConflict: 'client_id,question_key' }
          );
          setSaveMsg('Saved in all 4 languages ✓');
        }
      }
    } catch (err) {
      console.error('Translation error:', err);
      setSaveMsg('Saved in English. Translation failed.');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 4000);
  }

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
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Question Editor</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Customize the question text and helper text shown in your estimator tool.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            {[['flowmap', 'Flow Map'], ['list', 'Edit List']].map(([mode, modeLabel]) => (
              <button key={mode} type="button" onClick={() => { setViewMode(mode); setEditNodeKey(null); }}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: viewMode === mode ? PRIMARY : '#fff', color: viewMode === mode ? '#fff' : '#374151', border: `1px solid ${viewMode === mode ? PRIMARY : '#e8ede8'}`, cursor: 'pointer', fontFamily: FONT }}>
                {modeLabel}
              </button>
            ))}
            <button type="button" onClick={() => {
              if (!window.confirm('Reset all questions to default labels? This will overwrite your custom text.')) return;
              const reset = {};
              QUESTION_FLOW.forEach(({ key }) => { reset[key] = makeDefault(key); });
              setQuestions(reset);
              setHasChanges(true);
              setResetBanner(true);
              setTimeout(() => setResetBanner(false), 4000);
            }}
              style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: '#fff', color: '#374151', border: '1px solid #e8ede8', cursor: 'pointer', fontFamily: FONT }}>
              Reset All
            </button>
          </div>
        </div>

        {resetBanner && (
          <div style={{ backgroundColor: '#fef9c3', color: '#854d0e', borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', fontFamily: FONT }}>
            Questions reset to defaults. Click Save All to apply.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading questions…</div>
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
            {/* ── Flow Map ── */}
            {viewMode === 'flowmap' && (
              <>
                <FlowMap
                  questions={questions}
                  editNodeKey={editNodeKey}
                  onSelectNode={k => setEditNodeKey(prev => prev === k ? null : k)}
                />
                {editNodeKey && (
                  <EditPanel
                    nodeKey={editNodeKey}
                    questions={questions}
                    onSave={handleEditSave}
                    onClose={() => setEditNodeKey(null)}
                    clientId={clientId}
                  />
                )}
              </>
            )}

            {/* ── Edit List ── */}
            {viewMode === 'list' && (
              <>
                <div style={{ backgroundColor: '#f0fdf4', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#166534', fontFamily: FONT }}>Write in your preferred language. Other languages are filled automatically when you save.</p>
                </div>

                {/* Save bar top */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <button type="button" onClick={handleSave} disabled={saving}
                    style={{ padding: '9px 24px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: saving ? '#9ca3af' : PRIMARY, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving…' : 'Save All'}
                  </button>
                  {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{saveMsg}</span>}
                  {error   && <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500', fontFamily: FONT }}>{error}</span>}
                </div>

                {QUESTION_FLOW.map(node => {
                  const q = questions[node.key] || makeDefault(node.key);
                  return (
                    <div key={node.key} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e8ede8', padding: '14px 18px', marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, width: '72px', paddingTop: '2px' }}>
                        <span style={{ backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '700', fontFamily: FONT, textAlign: 'center' }}>{node.num}</span>
                        {node.conditional && <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', borderRadius: '20px', padding: '2px 6px', fontSize: '10px', fontWeight: '600', fontFamily: FONT, textAlign: 'center' }}>cond.</span>}
                      </div>
                      {/* Inputs */}
                      <div style={{ flex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '170px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT, marginBottom: '4px' }}>Question text</div>
                          <input type="text" value={q.label_en || ''} onChange={e => update(node.key, 'label_en', e.target.value)} maxLength={160}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 11px', fontSize: '13px', color: '#0d1117', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', backgroundColor: '#fff', fontFamily: FONT }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '170px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', fontFamily: FONT, marginBottom: '4px' }}>Helper text</div>
                          <input type="text" value={q.helper_en || ''} onChange={e => update(node.key, 'helper_en', e.target.value)} maxLength={200}
                            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 11px', fontSize: '13px', color: '#0d1117', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', backgroundColor: '#fff', fontFamily: FONT }} />
                        </div>
                      </div>
                      {/* Controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, alignItems: 'flex-end', paddingTop: '2px' }}>
                        <div onClick={() => update(node.key, 'visible', !q.visible)} style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: q.visible ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: q.visible ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                        </div>
                        <button type="button"
                          onClick={() => { const f = QUESTION_FLOW_MAP[node.key]; update(node.key, 'label_en', f?.label || ''); update(node.key, 'helper_en', f?.helper || ''); }}
                          style={{ fontSize: '11px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, padding: '2px 4px', borderRadius: '4px' }}
                          title="Reset to default">↺</button>
                      </div>
                    </div>
                  );
                })}

                {/* Save bar bottom */}
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={handleSave} disabled={saving}
                    style={{ padding: '9px 24px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600', backgroundColor: saving ? '#9ca3af' : PRIMARY, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving…' : 'Save All'}
                  </button>
                  {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{saveMsg}</span>}
                </div>
              </>
            )}

            {/* Sticky save bar */}
            {hasChanges && !editNodeKey && (
              <div style={{ position: 'fixed', bottom: 0, left: '240px', right: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e8ede8', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.06)', fontFamily: FONT }}>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>You have unsaved changes</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={handleSave} disabled={saving}
                    style={{ padding: '10px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', backgroundColor: saving ? '#9ca3af' : PRIMARY, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving…' : 'Save All'}
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
