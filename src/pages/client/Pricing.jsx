import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfigStatus } from '../../context/ConfigStatusContext';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';
import TrialExpiredOverlay from '../../components/TrialExpiredOverlay';
import useClientPlan from '../../hooks/useClientPlan';
import UpgradeLock from '../../components/UpgradeLock';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px', marginBottom: '16px' };

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{title}</h1>
      {subtitle && <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>{subtitle}</p>}
    </div>
  );
}

function SettingsCard({ title, subtitle, children }) {
  return (
    <div style={CARD}>
      {title && <p style={{ margin: subtitle ? '0 0 4px' : '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{title}</p>}
      {subtitle && <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#9ca3af', fontFamily: FONT, lineHeight: '1.5' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function SaveButton({ onClick, saveMsg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
      {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{saveMsg}</span>}
      <button type="button" onClick={onClick}
        style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
        Save
      </button>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: value ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: value ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT }}>{label}</label>
      {children}
    </div>
  );
}

function PriceInput({ value, onChange, placeholder }) {
  return (
    <input type="number" value={value === '0' || value === 0 ? '' : value} className="price-input"
      placeholder={placeholder !== undefined ? String(placeholder) : undefined}
      onChange={e => {
        const raw = parseFloat(e.target.value);
        if (isNaN(raw)) { onChange(''); return; }
        const clamped = Math.min(Math.max(raw, 0), 999999);
        onChange(String(clamped));
      }}
      style={{ width: '80px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', textAlign: 'center', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117' }} />
  );
}

function useSaveMsg() {
  const [saveMsg, setSaveMsg] = useState('');
  function flash() { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000); }
  return [saveMsg, flash];
}

const PRICE_DEFAULTS = {
  planning: 5000, establishment_zone1: 12000, establishment_zone2: 30000,
  de_establishment: 5000, admin: 1200, inspection: 3500,
  gravity_pipe: 149, pressure_pipe: 39, protection_pipe: 42,
  cable: 49, labor: 1500, makadam: 400,
  pump_well: 15500, double_pump: 4500, telescope_cover: 2800,
  lawn_restoration_base: 15000, mass_removal: 7904, transport: 5000,
};

const BASE_DEFAULTS = {
  bdt:    { '1': 39900, '2': 54900,  '3': 74900,  '4': 99900,  '5': 119900 },
  wc:     { '1': 74900, '2': 99900,  '3': 129900, '4': 149900, '5': 169900 },
  wc_bdt: { '1': 99900, '2': 119900, '3': 149900, '4': 179900, '5': 219900 },
};

function PricingContent({ clientId }) {
  const { profile } = useAuth();
  const hh = ['1','2','3','4','5'];

  function makeList(obj, entries) {
    return entries.map(([key, label]) => ({ key, label, value: obj[key] === 0 ? '' : String(obj[key] ?? '') }));
  }

  const [hoveredRowLabel, setHoveredRowLabel] = useState(null);
  const ROW_TOOLTIPS = {
    bdt:    'Biological Drain Field Treatment',
    wc:     'Water Closet waste only, no grey water',
    wc_bdt: 'Full system: WC + grey water treatment',
  };

  const [loading,    setLoading]    = useState(true);
  const [baseGrid,   setBaseGrid]   = useState([
    { key: 'bdt',    label: 'BDT',     values: hh.map(() => '') },
    { key: 'wc',     label: 'WC only', values: hh.map(() => '') },
    { key: 'wc_bdt', label: 'WC+BDT',  values: hh.map(() => '') },
  ]);
  const [fixedCosts, setFixedCosts] = useState(makeList({}, [
    ['planning',           'Planning/Municipality Application'],
    ['establishment_zone1','Establishment Zone 1'],
    ['establishment_zone2','Establishment Zone 2'],
    ['de_establishment',   'De-establishment'],
    ['admin',              'Admin Fee'],
    ['inspection',         'Inspection of Existing Well'],
  ]));
  const [perMeter, setPerMeter] = useState(makeList({}, [
    ['gravity_pipe',   'Gravity Pipe per meter'],
    ['pressure_pipe',  'Pressure Pipe per meter'],
    ['protection_pipe','Protection Pipe per meter'],
    ['cable',          'Electric Cable per meter'],
    ['makadam',        'Makadam per ton'],
    ['labor',          'Labor Rate per hour'],
  ]));
  const [addOns, setAddOns] = useState(makeList({}, [
    ['pump_well',             'Pump Well'],
    ['double_pump',           'Double Pump'],
    ['telescope_cover',       'Telescope + Well Cover'],
    ['lawn_restoration_base', 'Lawn Restoration Base'],
    ['mass_removal',          'Mass Removal'],
    ['transport',             'Transport'],
  ]));
  const [rotEnabled, setRotEnabled] = useState(false);
  const [rotPercent,  setRotPercent] = useState('30');
  const [currency,    setCurrency]   = useState('SEK');
  const [saveMsg, flash] = useSaveMsg();
  const [resetMsg, setResetMsg] = useState('');
  const [lastSavedPricing, setLastSavedPricing] = useState(() => localStorage.getItem(`qq360_last_saved_pricing_${profile?.id || 'anon'}`) || '');
  const [showPreview,        setShowPreview]        = useState(false);
  const [previewSystemType,  setPreviewSystemType]  = useState('bdt');
  const [previewHouseholds,  setPreviewHouseholds]  = useState('1');
  const [previewZone,        setPreviewZone]        = useState('Zone 1');
  const [hoveredHH, setHoveredHH] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_pricing').select('*').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const p  = data || {};
        const bp = p.base_prices     || {};
        const fc = p.fixed_costs     || {};
        const pm = p.per_meter_costs || {};
        const ao = p.addons          || {};
        setBaseGrid([
          { key: 'bdt',    label: 'BDT',     values: hh.map(h => { const v = bp.bdt?.[h];    return v === 0 ? '' : String(v ?? ''); }) },
          { key: 'wc',     label: 'WC only', values: hh.map(h => { const v = bp.wc?.[h];     return v === 0 ? '' : String(v ?? ''); }) },
          { key: 'wc_bdt', label: 'WC+BDT',  values: hh.map(h => { const v = bp.wc_bdt?.[h]; return v === 0 ? '' : String(v ?? ''); }) },
        ]);
        setFixedCosts(makeList(fc, [
          ['planning',           'Planning/Municipality Application'],
          ['establishment_zone1','Establishment Zone 1'],
          ['establishment_zone2','Establishment Zone 2'],
          ['de_establishment',   'De-establishment'],
          ['admin',              'Admin Fee'],
          ['inspection',         'Inspection of Existing Well'],
        ]));
        setPerMeter(makeList(pm, [
          ['gravity_pipe',   'Gravity Pipe per meter'],
          ['pressure_pipe',  'Pressure Pipe per meter'],
          ['protection_pipe','Protection Pipe per meter'],
          ['cable',          'Electric Cable per meter'],
          ['makadam',        'Makadam per ton'],
          ['labor',          'Labor Rate per hour'],
        ]));
        setAddOns(makeList(ao, [
          ['pump_well',             'Pump Well'],
          ['double_pump',           'Double Pump'],
          ['telescope_cover',       'Telescope + Well Cover'],
          ['lawn_restoration_base', 'Lawn Restoration Base'],
          ['mass_removal',          'Mass Removal'],
          ['transport',             'Transport'],
        ]));
        setRotEnabled(p.rot_enabled    ?? false);
        setRotPercent(String(p.rot_percentage ?? 30));
        setCurrency(p.currency || 'SEK');
        setLoading(false);
      });
  }, [clientId]);

  if (loading) return (
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

  function updateGrid(ri, ci, val) {
    setBaseGrid(prev => prev.map((row, r) => r === ri ? { ...row, values: row.values.map((v, c) => c === ci ? val : v) } : row));
  }
  function updateList(setter, idx, val) {
    setter(prev => prev.map((item, i) => i === idx ? { ...item, value: val } : item));
  }

  async function handleReset() {
    if (!window.confirm('Reset all pricing to zero? This will clear all your pricing data.')) return;
    const zero5 = Object.fromEntries(hh.map(h => [h, 0]));
    setBaseGrid(prev => prev.map(row => ({ ...row, values: hh.map(() => '0') })));
    setFixedCosts(prev => prev.map(item => ({ ...item, value: '0' })));
    setPerMeter(prev => prev.map(item => ({ ...item, value: '0' })));
    setAddOns(prev => prev.map(item => ({ ...item, value: '0' })));
    setRotEnabled(false);
    setRotPercent('30');
    setCurrency('SEK');
    await supabase.from('client_pricing').update({
      base_prices: { bdt: zero5, wc: zero5, wc_bdt: zero5 },
      fixed_costs: Object.fromEntries(fixedCosts.map(i => [i.key, 0])),
      per_meter_costs: Object.fromEntries(perMeter.map(i => [i.key, 0])),
      addons: Object.fromEntries(addOns.map(i => [i.key, 0])),
      rot_enabled: false,
      rot_percentage: 30,
      currency: 'SEK',
    }).eq('client_id', clientId);
    setResetMsg('Reset complete');
    setTimeout(() => setResetMsg(''), 2000);
  }

  async function handleSave() {
    const base_prices = Object.fromEntries(baseGrid.map(row => [
      row.key, Object.fromEntries(hh.map((h, i) => [h, Number(row.values[i] || 0)]))
    ]));
    const toObj = arr => Object.fromEntries(arr.map(item => [item.key, Number(item.value || 0)]));
    await supabase.from('client_pricing').update({
      base_prices,
      fixed_costs:     toObj(fixedCosts),
      per_meter_costs: toObj(perMeter),
      addons:          toObj(addOns),
      rot_enabled:     rotEnabled,
      rot_percentage:  Number(rotPercent || 30),
      currency,
    }).eq('client_id', clientId);
    flash();
    const ts = new Date().toISOString();
    localStorage.setItem(`qq360_last_saved_pricing_${profile?.id || 'anon'}`, ts);
    setLastSavedPricing(ts);
  }

  function PriceRows({ items, setter }) {
    return items.map((item, i) => (
      <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontFamily: FONT }}>{item.label}</span>
        <PriceInput value={item.value} onChange={val => updateList(setter, i, val)} placeholder={PRICE_DEFAULTS[item.key]} />
      </div>
    ));
  }

  const selStyle = { width: '100%', height: '42px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px', fontSize: '13.5px', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer', outline: 'none' };

  return (
    <>
      <style>{`.price-input::placeholder{color:#9ca3af}.price-input::-webkit-inner-spin-button,.price-input::-webkit-outer-spin-button{display:none}.price-input{-moz-appearance:textfield}`}</style>
      <SectionHeader title="Pricing" subtitle="Set your pricing for the estimator tool." />
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: '600', marginBottom: '16px', fontFamily: FONT }}>
        <div style={{ width: '6px', height: '6px', backgroundColor: '#16a34a', borderRadius: '50%', flexShrink: 0 }} />
        Prices update live in your estimator tool after saving
      </div>

      <SettingsCard title="Base System Prices" subtitle="Starting price per system type and household count. Underground installation adds a 1.2x multiplier automatically. If left empty, tool uses the default prices shown.">
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 80px)', gap: '8px', alignItems: 'center' }}>
            <div />
            {hh.map((h, ci) => (
              <div key={h} style={{ position: 'relative', fontSize: '11px', color: '#9ca3af', fontWeight: '600', textAlign: 'center', fontFamily: FONT }}
                onMouseEnter={() => setHoveredHH(ci)} onMouseLeave={() => setHoveredHH(null)}>
                {h} hh
                {hoveredHH === ci && (
                  <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0d1117', color: '#fff', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 10, marginBottom: '4px', pointerEvents: 'none' }}>
                    Number of households
                  </div>
                )}
              </div>
            ))}
            {baseGrid.map((row, ri) => (
              <>
                <div key={row.key} style={{ position: 'relative', fontSize: '13px', color: '#374151', fontWeight: '500', fontFamily: FONT, cursor: 'default' }}
                  onMouseEnter={() => setHoveredRowLabel(row.key)} onMouseLeave={() => setHoveredRowLabel(null)}>
                  {row.label}
                  {hoveredRowLabel === row.key && (
                    <div style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px', backgroundColor: '#0d1117', color: '#fff', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                      {ROW_TOOLTIPS[row.key]}
                    </div>
                  )}
                </div>
                {hh.map((_, ci) => <PriceInput key={ci} value={row.values[ci]} onChange={val => updateGrid(ri, ci, val)} placeholder={BASE_DEFAULTS[row.key]?.[hh[ci]]} />)}
              </>
            ))}
          </div>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Prices are in the currency selected below.</p>
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT, lineHeight: '1.5' }}>Underground installation automatically adds a 1.2x multiplier to the base price. This is built into the tool and cannot be changed from the dashboard.</p>
      </SettingsCard>

      <SettingsCard title="Fixed Costs" subtitle="Flat fees added to every estimate. Planning covers municipality application. Establishment cost depends on the customer's zone. Configure zones in the Municipalities page.">
        <PriceRows items={fixedCosts} setter={setFixedCosts} />
      </SettingsCard>

      <SettingsCard title="Per Meter Costs" subtitle="Used when the customer says new pipes are needed or excavation is required. The tool calculates total pipe cost based on these rates multiplied by the meters entered. Labor rate is in kr per hour.">
        <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#166534', fontFamily: FONT, lineHeight: '1.5' }}>
          Above ground pipe: base 2,500 kr plus rates per meter. Underground pipe: gravity pipe rate per meter plus 30% of labor rate per meter. Both types add makadam cost based on trench volume.
        </div>
        <PriceRows items={perMeter} setter={setPerMeter} />
      </SettingsCard>

      <SettingsCard title="Add-on Services" subtitle="Added when the customer selects these options during the estimator. Lawn restoration base price has 1,500 kr labor added on top automatically by the tool.">
        <PriceRows items={addOns} setter={setAddOns} />
      </SettingsCard>

      <SettingsCard title="ROT Deduction">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: rotEnabled ? '14px' : 0 }}>
          <Toggle value={rotEnabled} onChange={setRotEnabled} />
          <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: FONT }}>ROT Deduction {rotEnabled ? 'enabled' : 'disabled'}</span>
        </div>
        {rotEnabled && (
          <FieldRow label="Deduction Percentage">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PriceInput value={rotPercent} onChange={setRotPercent} />
              <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT }}>%</span>
            </div>
          </FieldRow>
        )}
        {rotEnabled && (() => {
          const pct = Number(rotPercent) || 0;
          const deduction = Math.round(100000 * pct / 100);
          const customerPays = 100000 - deduction;
          return (
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#166534', lineHeight: '1.6', marginTop: '12px', fontFamily: FONT }}>
              <strong>Example:</strong> A job priced at 100,000 kr with {pct}% ROT deduction.<br />
              Customer pays: <strong>{customerPays.toLocaleString()} kr</strong><br />
              Tax deduction: <strong>{deduction.toLocaleString()} kr</strong>
            </div>
          );
        })()}
        <p style={{ margin: '14px 0 0', fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', fontFamily: FONT }}>
          ROT deduction (Rot-avdrag) is a Swedish tax deduction for labor costs on repair, conversion, and extension work. Customers can deduct 30% of labor costs directly from their invoice.
        </p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', fontFamily: FONT }}>
          Note: the 1,500 kr lawn restoration labor charge is always added regardless of ROT deduction settings.
        </p>
      </SettingsCard>

      <SettingsCard title="Currency">
        <FieldRow label="Currency">
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={selStyle}>
            {['SEK','EUR','GBP','NOK','DKK'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FieldRow>
      </SettingsCard>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {resetMsg && <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', fontFamily: FONT }}>{resetMsg}</span>}
          <button type="button" onClick={handleReset}
            style={{ backgroundColor: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            Reset to Defaults
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={() => setShowPreview(true)}
            style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            Preview Estimate
          </button>
          <SaveButton onClick={handleSave} saveMsg={saveMsg} />
        </div>
        {lastSavedPricing && <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT, textAlign: 'right' }}>Last saved: {(() => { const d = new Date(lastSavedPricing); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}</p>}
      </div>

      {showPreview && (() => {
        const baseRow = baseGrid.find(r => r.key === previewSystemType);
        const baseVal = baseRow ? Number(baseRow.values[Number(previewHouseholds) - 1] || 0) : 0;
        const undergroundAmt = baseVal > 0 ? Math.round(baseVal * 0.2) : 0;
        const estKey = previewZone === 'Zone 1' ? 'establishment_zone1' : 'establishment_zone2';
        const estCost = Number(fixedCosts.find(f => f.key === estKey)?.value || 0);
        const planningCost = Number(fixedCosts.find(f => f.key === 'planning')?.value || 0);
        const deEstCost = Number(fixedCosts.find(f => f.key === 'de_establishment')?.value || 0);
        const adminCost = Number(fixedCosts.find(f => f.key === 'admin')?.value || 0);
        const rotDeduction = rotEnabled ? Math.round(baseVal * Number(rotPercent) / 100) : 0;
        const total = baseVal + undergroundAmt + estCost + planningCost + deEstCost + adminCost - rotDeduction;
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '36px', width: '520px', maxWidth: '90vw', boxSizing: 'border-box', fontFamily: FONT }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>Estimate Preview</h2>
                <button type="button" onClick={() => setShowPreview(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#9ca3af', lineHeight: 1, padding: '4px' }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>System Type</label>
                  <select value={previewSystemType} onChange={e => setPreviewSystemType(e.target.value)}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', fontFamily: FONT, outline: 'none', backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer' }}>
                    <option value="bdt">BDT</option>
                    <option value="wc">WC only</option>
                    <option value="wc_bdt">WC+BDT</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Households</label>
                  <select value={previewHouseholds} onChange={e => setPreviewHouseholds(e.target.value)}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', fontFamily: FONT, outline: 'none', backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer' }}>
                    {['1','2','3','4','5'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Zone</label>
                  <select value={previewZone} onChange={e => setPreviewZone(e.target.value)}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', fontFamily: FONT, outline: 'none', backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer' }}>
                    <option value="Zone 1">Zone 1</option>
                    <option value="Zone 2">Zone 2</option>
                  </select>
                </div>
              </div>
              <div style={{ backgroundColor: '#0d1f12', borderRadius: '16px', padding: '24px' }}>
                {[
                  { label: 'Base System Price', amount: baseVal },
                  ...(baseVal > 0 ? [{ label: 'Underground multiplier (1.2x)', amount: undergroundAmt }] : []),
                  { label: 'Planning', amount: planningCost },
                  { label: `Establishment (${previewZone})`, amount: estCost },
                  { label: 'De-establishment', amount: deEstCost },
                  { label: 'Admin Fee', amount: adminCost },
                  ...(rotEnabled ? [{ label: `ROT Deduction (${rotPercent}%)`, amount: rotDeduction, negative: true }] : []),
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '13px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                    <span style={{ fontWeight: '600', color: item.negative ? '#f87171' : 'rgba(255,255,255,0.85)' }}>
                      {item.negative ? '−' : ''}{Math.abs(item.amount).toLocaleString()} {currency}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '10px', paddingTop: '12px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</p>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: '800', color: '#a3e635', letterSpacing: '-1px', lineHeight: 1 }}>
                    {total > 0 ? `${total.toLocaleString()} ${currency}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

function ConfigStatusCard() {
  const { dots } = useConfigStatus();
  const navigate = useNavigate();
  const labels = ['Brand', 'Pricing', 'PDF', 'Areas', 'Questions'];
  const destinations = ['/client/settings', '/client/pricing', '/client/pdf', '/client/municipalities', '/client/questions'];
  const count = dots.filter(Boolean).length;
  const firstUndone = dots.findIndex(d => !d);
  return (
    <div style={{ ...CARD, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

export default function Pricing() {
  const { profile } = useAuth();
  const clientId    = profile?.client_id;
  const { plan, planLoading } = useClientPlan();
  const [trialExpired,      setTrialExpired]      = useState(false);
  const [planEmailSent,     setPlanEmailSent]     = useState(false);
  const [installPreference, setInstallPreference] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('clients').select('plan, created_at, install_preference').eq('id', clientId).single()
      .then(({ data }) => { setInstallPreference(data?.install_preference || null); if (data?.plan === 'free_trial' && (Date.now() - new Date(data.created_at).getTime()) / 86400000 > 14) setTrialExpired(true); });
  }, [clientId]);

  async function sendPlanEmail(planName) {
    await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'team@aiworldpartners.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${clientId}.` }) }).catch(() => {});
    setPlanEmailSent(true);
  }

  if (planLoading) return (
    <ClientLayout title="Pricing">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ height: '16px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '80%', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </ClientLayout>
  );

  if (plan === 'starter') return (
    <ClientLayout title="Pricing">
      <UpgradeLock feature="Pricing Editor" requiredPlan="growth" />
    </ClientLayout>
  );

  return (
    <ClientLayout title="Pricing">
      <TrialExpiredOverlay trialExpired={trialExpired} planEmailSent={planEmailSent} sendPlanEmail={sendPlanEmail} clientId={clientId} installPreference={installPreference} />
      <ConfigStatusCard />
      <PricingContent clientId={clientId} />
    </ClientLayout>
  );
}
