import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';

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

function SettingsCard({ title, children }) {
  return (
    <div style={CARD}>
      {title && <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{title}</p>}
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

function PriceInput({ value, onChange }) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '80px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', textAlign: 'center', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117' }} />
  );
}

function useSaveMsg() {
  const [saveMsg, setSaveMsg] = useState('');
  function flash() { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000); }
  return [saveMsg, flash];
}

function PricingContent({ clientId }) {
  const hh = ['1','2','3','4','5'];

  function makeList(obj, entries) {
    return entries.map(([key, label]) => ({ key, label, value: String(obj[key] ?? '') }));
  }

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
          { key: 'bdt',    label: 'BDT',     values: hh.map(h => String(bp.bdt?.[h]    ?? '')) },
          { key: 'wc',     label: 'WC only', values: hh.map(h => String(bp.wc?.[h]     ?? '')) },
          { key: 'wc_bdt', label: 'WC+BDT',  values: hh.map(h => String(bp.wc_bdt?.[h] ?? '')) },
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
  }

  function PriceRows({ items, setter }) {
    return items.map((item, i) => (
      <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontFamily: FONT }}>{item.label}</span>
        <PriceInput value={item.value} onChange={val => updateList(setter, i, val)} />
      </div>
    ));
  }

  const selStyle = { width: '100%', height: '42px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px', fontSize: '13.5px', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer', outline: 'none' };

  return (
    <>
      <SectionHeader title="Pricing" subtitle="Set your pricing for the estimator tool." />

      <SettingsCard title="Base System Prices">
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 80px)', gap: '8px', alignItems: 'center' }}>
            <div />
            {hh.map(h => <div key={h} style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textAlign: 'center', fontFamily: FONT }}>{h} hh</div>)}
            {baseGrid.map((row, ri) => (
              <>
                <div key={row.key} style={{ fontSize: '13px', color: '#374151', fontWeight: '500', fontFamily: FONT }}>{row.label}</div>
                {hh.map((_, ci) => <PriceInput key={ci} value={row.values[ci]} onChange={val => updateGrid(ri, ci, val)} />)}
              </>
            ))}
          </div>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Prices are in the currency selected below.</p>
      </SettingsCard>

      <SettingsCard title="Fixed Costs"><PriceRows items={fixedCosts} setter={setFixedCosts} /></SettingsCard>
      <SettingsCard title="Per Meter Costs"><PriceRows items={perMeter} setter={setPerMeter} /></SettingsCard>
      <SettingsCard title="Add-on Services"><PriceRows items={addOns} setter={setAddOns} /></SettingsCard>

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
        <p style={{ margin: '14px 0 0', fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', fontFamily: FONT }}>
          ROT deduction (Rot-avdrag) is a Swedish tax deduction for labor costs on repair, conversion, and extension work. Customers can deduct 30% of labor costs directly from their invoice.
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
        <SaveButton onClick={handleSave} saveMsg={saveMsg} />
      </div>
    </>
  );
}

export default function Pricing() {
  const { profile } = useAuth();
  const clientId    = profile?.client_id;

  return (
    <ClientLayout title="Pricing">
      <PricingContent clientId={clientId} />
    </ClientLayout>
  );
}
