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

const ALL_MUNICIPALITIES = [
  'Ale','Alingsås','Alvesta','Aneby','Arboga','Arjeplog','Arvidsjaur','Arvika','Askersund',
  'Avesta','Bengtsfors','Berg','Bjurholm','Bjuv','Boden','Bollebygd','Bollnäs','Borgholm',
  'Borlänge','Borås','Botkyrka','Boxholm','Bromölla','Bräcke','Burlöv','Båstad',
  'Dals-Ed','Danderyd','Degerfors','Dorotea','Eda','Ekerö','Eksjö','Emmaboda',
  'Enköping','Eskilstuna','Eslöv','Essunga','Fagersta','Falkenberg','Falköping','Falun',
  'Filipstad','Finspång','Flen','Forshaga','Färgelanda','Gagnef','Gislaved','Gnesta',
  'Gnosjö','Gotland','Grums','Grästorp','Gullspång','Gällivare','Gävle','Göteborg',
  'Götene','Habo','Hagfors','Hallsberg','Hallstahammar','Halmstad','Hammarö','Haninge',
  'Haparanda','Heby','Hedemora','Helsingborg','Herrljunga','Hjo','Hofors','Huddinge',
  'Hudiksvall','Hultsfred','Hylte','Håbo','Hällefors','Härjedalen','Härnösand',
  'Härryda','Hässleholm','Höganäs','Högsby','Hörby','Höör','Jokkmokk','Järfälla',
  'Jönköping','Kalix','Kalmar','Karlsborg','Karlshamn','Karlskoga','Karlskrona',
  'Karlstad','Katrineholm','Kil','Kinda','Kiruna','Klippan','Knivsta','Kramfors',
  'Kristianstad','Kristinehamn','Krokom','Kumla','Kungsbacka','Kungsör','Kungälv',
  'Kävlinge','Köping','Laholm','Landskrona','Laxå','Lekeberg','Leksand','Lerum',
  'Lessebo','Lidingö','Lidköping','Lilla Edet','Lindesberg','Linköping','Ljungby',
  'Ljusdal','Ljusnarsberg','Lomma','Ludvika','Luleå','Lund','Lycksele','Lysekil',
  'Malmö','Malung-Sälen','Malå','Mariestad','Mark','Markaryd','Mellerud','Mjölby',
  'Mora','Motala','Mullsjö','Munkedal','Munkfors','Mölndal','Mönsterås','Mörbylånga',
  'Nacka','Nora','Norberg','Nordanstig','Nordmaling','Norrköping','Norrtälje',
  'Norsjö','Nybro','Nykvarn','Nyköping','Nynäshamn','Nässjö','Ockelbo','Olofström',
  'Orsa','Orust','Osby','Oskarshamn','Ovanåker','Oxelösund','Pajala','Partille',
  'Perstorp','Piteå','Ragunda','Robertsfors','Ronneby','Rättvik','Sala','Salem',
  'Sandviken','Sigtuna','Simrishamn','Sjöbo','Skara','Skellefteå','Skinnskatteberg',
  'Skurup','Skövde','Smedjebacken','Sollefteå','Sollentuna','Solna','Sorsele',
  'Sotenäs','Staffanstorp','Stenungsund','Stockholm','Storfors','Storuman','Strängnäs',
  'Strömstad','Strömsund','Sundbyberg','Sundsvall','Sunne','Surahammar','Svalöv',
  'Svedala','Svenljunga','Säffle','Säter','Sävsjö','Söderhamn','Söderköping',
  'Södertälje','Sölvesborg','Tanum','Tibro','Tidaholm','Tierp','Timrå','Tingsryd',
  'Tjörn','Tomelilla','Torsby','Torsås','Tranemo','Tranås','Trelleborg','Trollhättan',
  'Trosa','Tyresö','Täby','Töreboda','Uddevalla','Ulricehamn','Umeå','Upplands Väsby',
  'Upplands-Bro','Uppsala','Uppvidinge','Vadstena','Vaggeryd','Valdemarsvik','Vallentuna',
  'Vansbro','Vara','Varberg','Vaxholm','Vellinge','Vetlanda','Vilhelmina','Vimmerby',
  'Vindeln','Vingåker','Vårgårda','Vänersborg','Vännäs','Värmdö','Värnamo','Västervik',
  'Västerås','Växjö','Ydre','Ystad','Åmål','Ånge','Åre','Årjäng','Åsele','Åstorp',
  'Åtvidaberg','Älmhult','Älvdalen','Älvkarleby','Älvsbyn','Ängelholm','Öckerö',
  'Ödeshög','Örebro','Örkelljunga','Örnsköldsvik','Östersund','Österåker','Östhammar',
  'Östra Göinge','Överkalix','Övertorneå',
];

function MunicipalitiesContent({ clientId }) {
  const { profile } = useAuth();
  const [loading,           setLoading]           = useState(true);
  const [search,            setSearch]            = useState('');
  const [showSearch,        setShowSearch]        = useState(false);
  const [covered,           setCovered]           = useState([]);
  const [notCoveredMsg,     setNotCoveredMsg]     = useState('We currently do not cover your municipality.');
  const [notCoveredSaveMsg, setNotCoveredSaveMsg] = useState('');
  const [lastSavedMuni,     setLastSavedMuni]     = useState(() => localStorage.getItem(`qq360_last_saved_municipalities_${profile?.id || 'anon'}`) || '');
  const [addRefreshNote,    setAddRefreshNote]    = useState(false);
  const [rowErrors,         setRowErrors]         = useState({});
  const [zoneEditKey,       setZoneEditKey]       = useState(null);
  const [zoneEditName,      setZoneEditName]      = useState('');
  const [zoneEditPrice,     setZoneEditPrice]     = useState('');
  const [zoneSaving,        setZoneSaving]        = useState(false);

  useEffect(() => {
    if (!clientId) return;
    Promise.all([
      supabase.from('client_settings').select('language_settings').eq('client_id', clientId).maybeSingle(),
      supabase.from('client_municipalities').select('*').eq('client_id', clientId),
    ]).then(([{ data: settings }, { data: muns }]) => {
      const ls = settings?.language_settings || {};
      setNotCoveredMsg(ls.not_covered_message || 'We currently do not cover your municipality.');
      setCovered(muns || []);
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

  async function handleSaveNotCovered() {
    const { data: existing } = await supabase.from('client_settings').select('language_settings').eq('client_id', clientId).maybeSingle();
    const current = existing?.language_settings || {};
    await supabase.from('client_settings').update({
      language_settings: { ...current, not_covered_message: notCoveredMsg },
    }).eq('client_id', clientId);
    setNotCoveredSaveMsg('Saved!');
    setTimeout(() => setNotCoveredSaveMsg(''), 2000);
    const ts = new Date().toISOString();
    localStorage.setItem(`qq360_last_saved_municipalities_${profile?.id || 'anon'}`, ts);
    setLastSavedMuni(ts);
  }

  const filtered = ALL_MUNICIPALITIES.filter(m =>
    m.toLowerCase().includes(search.toLowerCase())
  );
  const showDropdown = search.length > 0 && filtered.length > 0;

  async function addMunicipality(name) {
    await supabase.from('client_municipalities')
      .insert({ client_id: clientId, municipality: name, zone: 'Zone 1', custom_price: 0 });
    const { data: newRow } = await supabase.from('client_municipalities')
      .select('*').eq('client_id', clientId).eq('municipality', name).maybeSingle();
    if (newRow) {
      setCovered(prev => [...prev, newRow]);
      setAddRefreshNote(false);
    } else {
      setCovered(prev => [...prev, { id: Date.now().toString(), client_id: clientId, municipality: name, zone: 'Zone 1', custom_price: 0 }]);
      setAddRefreshNote(true);
    }
    setSearch('');
    setShowSearch(false);
  }

  async function removeRow(rowId) {
    const { error } = await supabase.from('client_municipalities').delete().eq('id', rowId);
    if (error) {
      console.error('removeRow error:', error);
      setRowErrors(prev => ({ ...prev, [rowId]: 'Delete failed. Try again.' }));
      return;
    }
    setCovered(prev => prev.filter(c => c.id !== rowId));
    setRowErrors(prev => { const n = { ...prev }; delete n[rowId]; return n; });
  }

  async function updateZone(rowId, zoneName) {
    const { error } = await supabase.from('client_municipalities').update({ zone: zoneName }).eq('id', rowId);
    if (error) {
      console.error('updateZone error:', error);
      setRowErrors(prev => ({ ...prev, [rowId]: 'Zone update failed.' }));
      return;
    }
    setCovered(prev => prev.map(c => c.id === rowId ? { ...c, zone: zoneName } : c));
    setRowErrors(prev => { const n = { ...prev }; delete n[rowId]; return n; });
  }

  async function updatePrice(rowId, price) {
    const num = Number(price) || 0;
    const { error } = await supabase.from('client_municipalities').update({ custom_price: num }).eq('id', rowId);
    if (error) {
      console.error('updatePrice error:', error);
      setRowErrors(prev => ({ ...prev, [rowId]: 'Price update failed.' }));
      return;
    }
    setCovered(prev => prev.map(c => c.id === rowId ? { ...c, custom_price: num } : c));
    setRowErrors(prev => { const n = { ...prev }; delete n[rowId]; return n; });
  }

  async function handleZoneBulkSave() {
    setZoneSaving(true);
    const newPrice = Number(zoneEditPrice) || 0;
    const targets = covered.filter(c => (c.zone || 'Zone 1') === zoneEditKey);
    let failed = false;
    for (const c of targets) {
      const { error } = await supabase.from('client_municipalities')
        .update({ zone: zoneEditName, custom_price: newPrice }).eq('id', c.id);
      if (error) { console.error('Zone bulk save error:', error); failed = true; }
    }
    if (!failed) {
      setCovered(prev => prev.map(c =>
        (c.zone || 'Zone 1') === zoneEditKey ? { ...c, zone: zoneEditName, custom_price: newPrice } : c
      ));
    }
    setZoneEditKey(null);
    setZoneSaving(false);
  }

  async function handleZoneDelete(zoneName) {
    if (!window.confirm(`Delete all municipalities in "${zoneName}"? This cannot be undone.`)) return;
    const targets = covered.filter(c => (c.zone || 'Zone 1') === zoneName);
    for (const c of targets) {
      await supabase.from('client_municipalities').delete().eq('id', c.id);
    }
    setCovered(prev => prev.filter(c => (c.zone || 'Zone 1') !== zoneName));
  }

  const zoneSuggestions = [...new Set(covered.map(c => c.zone).filter(Boolean))];

  const zoneMap = {};
  covered.forEach(c => {
    const z = c.zone || 'Zone 1';
    if (!zoneMap[z]) zoneMap[z] = { count: 0, prices: [] };
    zoneMap[z].count++;
    zoneMap[z].prices.push(c.custom_price || 0);
  });
  const zoneSummary = Object.entries(zoneMap).map(([name, { count, prices }]) => ({
    name,
    count,
    price: prices.every(p => p === prices[0]) ? prices[0] : null,
  }));

  const inputStyle = { border: '1px solid #e8ede8', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontFamily: FONT, outline: 'none', color: '#0d1117', backgroundColor: '#fff' };

  return (
    <>
      <SectionHeader title="Municipalities" subtitle="Select which Swedish municipalities you cover." />

      {/* Zones Summary card — above the municipality list */}
      {zoneSummary.length > 0 && (
        <div style={CARD}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Zones Summary</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid #e8ede8', marginBottom: '4px' }}>
            <span style={{ flex: 1, fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Zone</span>
            <span style={{ width: '110px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Municipalities</span>
            <span style={{ width: '100px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT, textAlign: 'right' }}>Price</span>
            <span style={{ width: '150px' }} />
          </div>
          {zoneSummary.map(z => (
            <div key={z.name}>
              {zoneEditKey === z.name ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderBottom: '1px solid #f4f6f4', flexWrap: 'wrap' }}>
                  <input value={zoneEditName} onChange={e => setZoneEditName(e.target.value)}
                    placeholder="Zone name"
                    style={{ flex: 1, minWidth: '120px', ...inputStyle, fontSize: '13px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="number" value={zoneEditPrice} onChange={e => setZoneEditPrice(e.target.value)} min="0"
                      style={{ width: '90px', ...inputStyle, fontSize: '13px', textAlign: 'right' }} />
                    <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT }}>kr</span>
                  </div>
                  <button type="button" onClick={handleZoneBulkSave} disabled={zoneSaving}
                    style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '12px', fontWeight: '600', cursor: zoneSaving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: zoneSaving ? 0.7 : 1 }}>
                    {zoneSaving ? 'Saving...' : 'Save All'}
                  </button>
                  <button type="button" onClick={() => setZoneEditKey(null)}
                    style={{ background: 'none', border: '1px solid #e8ede8', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', color: '#6b7280', cursor: 'pointer', fontFamily: FONT }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderBottom: '1px solid #f4f6f4' }}>
                  <span style={{ flex: 1, fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{z.name}</span>
                  <span style={{ width: '110px', fontSize: '12px', color: '#6b7280', fontFamily: FONT }}>{z.count} {z.count === 1 ? 'municipality' : 'municipalities'}</span>
                  <span style={{ width: '100px', fontSize: '13px', fontWeight: '600', color: '#0d1117', fontFamily: FONT, textAlign: 'right' }}>
                    {z.price === null ? 'Mixed' : `${z.price.toLocaleString()} kr`}
                  </span>
                  <div style={{ width: '150px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button"
                      onClick={() => { setZoneEditKey(z.name); setZoneEditName(z.name); setZoneEditPrice(z.price === null ? '0' : String(z.price)); }}
                      style={{ backgroundColor: '#f0f2f5', color: '#374151', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleZoneDelete(z.name)}
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                      Delete All
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main municipality card */}
      <div style={CARD}>
        {/* Add Municipality — always at top, always visible */}
        <div style={{ marginBottom: '20px' }}>
          <button type="button" onClick={() => setShowSearch(s => !s)}
            style={{ backgroundColor: PRIMARY, color: '#fff', borderRadius: '10px', padding: '10px 22px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: FONT }}>
            + Add Municipality
          </button>
          {addRefreshNote && (
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#d97706', fontFamily: FONT }}>
              Municipality added. If it does not appear, refresh the page.
            </p>
          )}
          {showSearch && (
            <div style={{ position: 'relative', marginTop: '12px' }}>
              <input type="text" placeholder="Search municipality..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 16px', fontSize: '13.5px', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117' }} />
              {showDropdown && (
                <div style={{ position: 'absolute', top: '46px', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #e8ede8', borderRadius: '12px', boxShadow: '0 4px 16px rgba(13,31,18,0.10)', zIndex: 10, overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' }}>
                  {filtered.map(m => {
                    const alreadyAdded = !!covered.find(c => c.municipality === m);
                    return (
                      <div key={m} onClick={() => !alreadyAdded && addMunicipality(m)}
                        style={{ padding: '10px 16px', fontSize: '13.5px', color: alreadyAdded ? '#9ca3af' : '#374151', cursor: alreadyAdded ? 'default' : 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.backgroundColor = '#f4f6f4'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <span>{m}</span>
                        {alreadyAdded && <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Already added</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Municipality list */}
        <div>
          {covered.length === 0 ? (
            <p style={{ fontSize: '13.5px', color: '#9ca3af', textAlign: 'center', padding: '20px 0', fontFamily: FONT }}>No municipalities added yet. Use the button above to add your first one.</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid #e8ede8', marginBottom: '4px' }}>
                <span style={{ flex: 1, fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Municipality</span>
                <span style={{ width: '140px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Zone Name</span>
                <span style={{ width: '90px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Price</span>
                <span style={{ width: '28px' }} />
              </div>
              {covered.map(c => (
                <div key={c.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderBottom: '1px solid #f4f6f4' }}>
                    <span style={{ flex: 1, fontSize: '13.5px', fontWeight: '500', fontFamily: FONT, color: '#0d1117' }}>{c.municipality}</span>
                    <div style={{ width: '140px' }}>
                      <input
                        type="text"
                        list={`zones-${c.id}`}
                        defaultValue={c.zone || ''}
                        placeholder="Zone name"
                        onBlur={e => updateZone(c.id, e.target.value)}
                        style={{ width: '100%', ...inputStyle }} />
                      <datalist id={`zones-${c.id}`}>
                        {zoneSuggestions.map(z => <option key={z} value={z} />)}
                      </datalist>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        defaultValue={c.custom_price || 0}
                        placeholder="0"
                        min="0"
                        onBlur={e => updatePrice(c.id, e.target.value)}
                        style={{ width: '90px', ...inputStyle, textAlign: 'right' }} />
                      <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT }}>kr</span>
                    </div>
                    <button type="button" onClick={() => removeRow(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#dc2626', lineHeight: 1, padding: '0 4px' }}>×</button>
                  </div>
                  {rowErrors[c.id] && (
                    <p style={{ margin: '2px 0 4px', fontSize: '11px', color: '#dc2626', fontFamily: FONT }}>{rowErrors[c.id]}</p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Not-covered message */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f4f6f4' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '6px', fontFamily: FONT }}>
            Message shown when municipality is not covered
          </label>
          <input type="text" value={notCoveredMsg} onChange={e => setNotCoveredMsg(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', color: '#0d1117', outline: 'none', fontFamily: FONT, backgroundColor: '#fff' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={handleSaveNotCovered}
              style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              Save Message
            </button>
            {notCoveredSaveMsg && <span style={{ fontSize: '13px', fontWeight: '600', color: '#16a34a', fontFamily: FONT }}>{notCoveredSaveMsg}</span>}
          </div>
          {lastSavedMuni && <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Last saved: {(() => { const d = new Date(lastSavedMuni); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}</p>}
        </div>
      </div>
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

export default function Municipalities() {
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
    await fetch('https://estimator-widget-production.up.railway.app/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'team@aiworldpartners.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${clientId}.` }) }).catch(() => {});
    setPlanEmailSent(true);
  }

  if (planLoading) return (
    <ClientLayout title="Municipalities">
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
    <ClientLayout title="Municipalities">
      <UpgradeLock feature="Municipality Editor" requiredPlan="growth" />
    </ClientLayout>
  );

  return (
    <ClientLayout title="Municipalities">
      <TrialExpiredOverlay trialExpired={trialExpired} planEmailSent={planEmailSent} sendPlanEmail={sendPlanEmail} clientId={clientId} installPreference={installPreference} />
      <ConfigStatusCard />
      <MunicipalitiesContent clientId={clientId} />
    </ClientLayout>
  );
}
