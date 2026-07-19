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
  const [rows,              setRows]              = useState([]);
  const [newZoneName,       setNewZoneName]       = useState('');
  const [newZonePrice,      setNewZonePrice]      = useState('');
  const [search,            setSearch]            = useState('');
  const [showSearch,        setShowSearch]        = useState(false);
  const [notCoveredMsg,     setNotCoveredMsg]     = useState('We currently do not cover your municipality.');
  const [notCoveredSaveMsg, setNotCoveredSaveMsg] = useState('');
  const [zoneEditId,        setZoneEditId]        = useState(null);
  const [zoneEditName,      setZoneEditName]      = useState('');
  const [zoneEditPrice,     setZoneEditPrice]     = useState('');
  const [lastSavedMuni,     setLastSavedMuni]     = useState(() => localStorage.getItem(`qq360_last_saved_municipalities_${profile?.id || 'anon'}`) || '');

  useEffect(() => {
    if (!clientId) return;
    Promise.all([
      supabase.from('client_settings').select('language_settings').eq('client_id', clientId).maybeSingle(),
      supabase.from('client_municipalities').select('*').eq('client_id', clientId),
    ]).then(([{ data: settings }, { data: muns }]) => {
      const ls = settings?.language_settings || {};
      setNotCoveredMsg(ls.not_covered_message || 'We currently do not cover your municipality.');
      setRows(muns || []);
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

  // Derive unique zones from rows
  const uniqueZoneNames = [...new Set(rows.map(r => r.zone).filter(Boolean))];
  const zones = uniqueZoneNames.map(zoneName => {
    const placeholderRow = rows.find(r => r.zone === zoneName && r.municipality === '__zone_placeholder__');
    const price = placeholderRow?.custom_price ?? rows.find(r => r.zone === zoneName)?.custom_price ?? 0;
    const muniCount = rows.filter(r => r.zone === zoneName && r.municipality !== '__zone_placeholder__').length;
    return { name: zoneName, price, muniCount };
  });

  const realRows = rows.filter(r => r.municipality !== '__zone_placeholder__');
  const filtered = ALL_MUNICIPALITIES.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  const showDropdown = search.length > 0 && filtered.length > 0;

  async function handleAddZone() {
    const name = newZoneName.trim();
    const price = Number(newZonePrice) || 0;
    console.log('handleAddZone called, name:', name, 'existing zones:', rows.filter(r => r.municipality === '__zone_placeholder__').map(r => r.zone));
    if (!name) return;
    console.log('duplicate check:', rows.some(r => r.municipality === '__zone_placeholder__' && r.zone === name));
    if (rows.some(r => r.municipality === '__zone_placeholder__' && r.zone === name)) return;
    const { error: insertError } = await supabase.from('client_municipalities')
      .insert({ client_id: clientId, municipality: '__zone_placeholder__', zone: name, custom_price: price });
    if (insertError) { console.error('Failed to add zone:', insertError); return; }
    const { data: allRows } = await supabase.from('client_municipalities').select('*').eq('client_id', clientId);
    if (allRows) setRows(allRows);
    setNewZoneName('');
    setNewZonePrice('');
  }

  async function handleZoneSave(originalName) {
    const newName = zoneEditName.trim();
    const newPrice = Number(zoneEditPrice) || 0;
    if (!newName) return;
    const { error } = await supabase.from('client_municipalities')
      .update({ zone: newName, custom_price: newPrice })
      .eq('client_id', clientId).eq('zone', originalName);
    if (error) { console.error('handleZoneSave error:', error); return; }
    const { data: allRows } = await supabase.from('client_municipalities').select('*').eq('client_id', clientId);
    if (allRows) setRows(allRows);
    setZoneEditId(null);
  }

  async function handleZoneDelete(zoneName) {
    if (!window.confirm(`Delete zone "${zoneName}" and all its municipalities? This cannot be undone.`)) return;
    const { error } = await supabase.from('client_municipalities')
      .delete().eq('client_id', clientId).eq('zone', zoneName);
    if (error) { console.error('handleZoneDelete error:', error); return; }
    const { data: allRows } = await supabase.from('client_municipalities').select('*').eq('client_id', clientId);
    if (allRows) setRows(allRows);
  }

  async function addMunicipality(name) {
    const placeholderZones = rows.filter(r => r.municipality === '__zone_placeholder__');
    if (placeholderZones.length === 0) return;
    const firstZone = placeholderZones[0].zone;
    const zonePrice = placeholderZones[0].custom_price || 0;
    const { error: insErr } = await supabase.from('client_municipalities')
      .insert({ client_id: clientId, municipality: name, zone: firstZone, custom_price: zonePrice });
    if (insErr) { console.error('addMunicipality insert error:', insErr); return; }
    const { data: allRows } = await supabase.from('client_municipalities').select('*').eq('client_id', clientId);
    if (allRows) setRows(allRows);
    setSearch('');
    setShowSearch(false);
  }

  async function removeMunicipality(rowId) {
    const { error } = await supabase.from('client_municipalities').delete().eq('id', rowId);
    if (error) { console.error('removeMunicipality error:', error); return; }
    const { data: allRows } = await supabase.from('client_municipalities').select('*').eq('client_id', clientId);
    if (allRows) setRows(allRows);
  }

  async function updateMunicipalityZone(rowId, newZoneName) {
    const zonePrice = zones.find(z => z.name === newZoneName)?.price ?? 0;
    const { error } = await supabase.from('client_municipalities')
      .update({ zone: newZoneName, custom_price: zonePrice }).eq('id', rowId);
    if (error) { console.error('updateMunicipalityZone error:', error); return; }
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, zone: newZoneName, custom_price: zonePrice } : r));
  }

  async function handleSaveNotCovered() {
    const { data: existing } = await supabase.from('client_settings').select('language_settings').eq('client_id', clientId).maybeSingle();
    const current = existing?.language_settings || {};
    const { error } = await supabase.from('client_settings').update({
      language_settings: { ...current, not_covered_message: notCoveredMsg },
    }).eq('client_id', clientId);
    if (error) { console.error('handleSaveNotCovered error:', error); return; }
    setNotCoveredSaveMsg('Saved!');
    setTimeout(() => setNotCoveredSaveMsg(''), 2000);
    const ts = new Date().toISOString();
    localStorage.setItem(`qq360_last_saved_municipalities_${profile?.id || 'anon'}`, ts);
    setLastSavedMuni(ts);
  }

  const fieldInputStyle = { border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px', fontSize: '13.5px', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117', outline: 'none', height: '42px', boxSizing: 'border-box' };
  const selStyle = { border: '1px solid #e8ede8', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer', outline: 'none' };

  return (
    <>
      <SectionHeader title="Municipalities" subtitle="Manage your zones and the municipalities you cover." />

      {/* SECTION 1 — ZONES */}
      <div style={CARD}>
        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Zones</p>
        <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#9ca3af', fontFamily: FONT, lineHeight: '1.5' }}>Create zones with different pricing. Municipalities are assigned to zones.</p>

        {/* Add zone form */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Zone name e.g. North, Zone 1, Stockholm area"
            value={newZoneName}
            onChange={e => setNewZoneName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddZone()}
            style={{ ...fieldInputStyle, flex: 1 }} />
          <input
            type="number"
            placeholder="Price (kr)"
            value={newZonePrice}
            onChange={e => setNewZonePrice(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddZone()}
            style={{ ...fieldInputStyle, width: '140px', flex: 'none' }} />
          <button type="button" onClick={handleAddZone}
            style={{ backgroundColor: PRIMARY, color: '#fff', borderRadius: '10px', padding: '0 20px', height: '42px', fontSize: '13.5px', fontWeight: '600', border: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0 }}>
            + Add Zone
          </button>
        </div>

        {/* Zone list */}
        {zones.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontFamily: FONT, padding: '8px 0' }}>No zones yet. Add a zone above to get started.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid #e8ede8', marginBottom: '4px' }}>
              <span style={{ flex: 1, fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Zone</span>
              <span style={{ width: '140px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Municipalities</span>
              <span style={{ width: '100px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT, textAlign: 'right' }}>Price</span>
              <span style={{ width: '160px' }} />
            </div>
            {zones.map(z => (
              <div key={z.name} style={{ padding: '12px 0', borderBottom: '1px solid #f4f6f4' }}>
                {zoneEditId === z.name ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      value={zoneEditName}
                      onChange={e => setZoneEditName(e.target.value)}
                      placeholder="Zone name"
                      style={{ flex: 1, minWidth: '120px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontFamily: FONT, outline: 'none', color: '#0d1117', backgroundColor: '#fff' }} />
                    <input
                      type="number"
                      value={zoneEditPrice}
                      onChange={e => setZoneEditPrice(e.target.value)}
                      min="0"
                      style={{ width: '100px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', fontFamily: FONT, outline: 'none', color: '#0d1117', backgroundColor: '#fff', textAlign: 'right' }} />
                    <button type="button" onClick={() => handleZoneSave(z.name)}
                      style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                      Save
                    </button>
                    <button type="button" onClick={() => setZoneEditId(null)}
                      style={{ background: 'none', border: '1px solid #e8ede8', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', color: '#6b7280', cursor: 'pointer', fontFamily: FONT }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{z.name}</span>
                    <span style={{ width: '140px' }}>
                      <span style={{ backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '600', fontFamily: FONT }}>
                        {z.muniCount} {z.muniCount === 1 ? 'municipality' : 'municipalities'}
                      </span>
                    </span>
                    <span style={{ width: '100px', fontSize: '13px', fontWeight: '600', color: '#0d1117', fontFamily: FONT, textAlign: 'right' }}>{z.price.toLocaleString()} kr</span>
                    <div style={{ width: '160px', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button type="button"
                        onClick={() => { setZoneEditId(z.name); setZoneEditName(z.name); setZoneEditPrice(String(z.price)); }}
                        style={{ backgroundColor: '#fff', color: '#374151', border: '1px solid #e8ede8', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleZoneDelete(z.name)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '18px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* SECTION 2 — MUNICIPALITIES */}
      <div style={CARD}>
        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Municipalities</p>
        <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#9ca3af', fontFamily: FONT, lineHeight: '1.5' }}>Add municipalities and assign them to a zone.</p>

        <div style={{ marginBottom: '20px' }}>
          <button type="button" onClick={() => setShowSearch(s => !s)}
            style={{ backgroundColor: PRIMARY, color: '#fff', borderRadius: '10px', padding: '10px 22px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: FONT }}>
            + Add Municipality
          </button>
          {showSearch && zones.length === 0 && (
            <div style={{ backgroundColor: '#fef9c3', color: '#854d0e', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginTop: '12px', fontFamily: FONT }}>
              Please create at least one zone first before adding municipalities.
            </div>
          )}
          {showSearch && zones.length > 0 && (
            <div style={{ position: 'relative', marginTop: '12px' }}>
              <input type="text" placeholder="Search municipality..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 16px', fontSize: '13.5px', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117' }} />
              {showDropdown && (
                <div style={{ position: 'absolute', top: '46px', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #e8ede8', borderRadius: '12px', boxShadow: '0 4px 16px rgba(13,31,18,0.10)', zIndex: 10, overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' }}>
                  {filtered.map(m => {
                    const alreadyAdded = realRows.some(r => r.municipality === m);
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

        {realRows.length === 0 ? (
          <p style={{ fontSize: '13.5px', color: '#9ca3af', fontFamily: FONT, padding: '8px 0' }}>No municipalities added yet.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid #e8ede8', marginBottom: '4px' }}>
              <span style={{ flex: 1, fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Municipality</span>
              <span style={{ width: '160px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Zone</span>
              <span style={{ width: '28px' }} />
            </div>
            {realRows.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderBottom: '1px solid #f4f6f4' }}>
                <span style={{ flex: 1, fontSize: '13.5px', fontWeight: '500', fontFamily: FONT, color: '#0d1117' }}>{r.municipality}</span>
                <div style={{ width: '160px' }}>
                  <select
                    value={r.zone || ''}
                    onChange={e => updateMunicipalityZone(r.id, e.target.value)}
                    style={selStyle}>
                    {rows.filter(r => r.municipality === '__zone_placeholder__').map(r => (
                      <option key={r.zone} value={r.zone}>{r.zone} — {(r.custom_price || 0).toLocaleString()} kr</option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={() => removeMunicipality(r.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#dc2626', lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* SECTION 3 — NOT COVERED MESSAGE */}
      <div style={CARD}>
        <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Not Covered Message</p>
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
    supabase.from('clients').select('plan, created_at, install_preference').eq('id', clientId).maybeSingle()
      .then(({ data }) => { setInstallPreference(data?.install_preference || null); if (data?.plan === 'free_trial' && (Date.now() - new Date(data.created_at).getTime()) / 86400000 > 14) setTrialExpired(true); });
  }, [clientId]);

  async function sendPlanEmail(planName) {
    await fetch('https://estimator-widget-production.up.railway.app/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'team@quickquote360.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${clientId}.` }) }).catch(() => {});
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
