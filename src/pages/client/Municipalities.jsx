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

function MunicipalitiesContent({ clientId, initialMunicipalities, initialSettings }) {
  const ls = initialSettings?.language_settings || {};

  const [search,          setSearch]          = useState('');
  const [covered,         setCovered]         = useState(initialMunicipalities || []);
  const [notCoveredMsg,   setNotCoveredMsg]   = useState(ls.not_covered_message || 'We currently do not cover your municipality.');
  const [notCoveredSaveMsg, setNotCoveredSaveMsg] = useState('');

  async function handleSaveNotCovered() {
    const { data: existing } = await supabase.from('client_settings').select('language_settings').eq('client_id', clientId).maybeSingle();
    const current = existing?.language_settings || {};
    await supabase.from('client_settings').update({
      language_settings: { ...current, not_covered_message: notCoveredMsg },
    }).eq('client_id', clientId);
    setNotCoveredSaveMsg('Saved!');
    setTimeout(() => setNotCoveredSaveMsg(''), 2000);
  }

  const filtered = ALL_MUNICIPALITIES.filter(m =>
    m.toLowerCase().includes(search.toLowerCase()) && !covered.find(c => c.municipality === m)
  );
  const showDropdown = search.length > 0 && filtered.length > 0;

  async function addMunicipality(name) {
    const { data } = await supabase.from('client_municipalities')
      .insert({ client_id: clientId, municipality: name, zone: 1 })
      .select().single();
    if (data) setCovered(prev => [...prev, data]);
    setSearch('');
  }

  async function removeRow(rowId) {
    await supabase.from('client_municipalities').delete().eq('id', rowId);
    setCovered(prev => prev.filter(c => c.id !== rowId));
  }

  async function changeZone(rowId, zone) {
    await supabase.from('client_municipalities').update({ zone }).eq('id', rowId);
    setCovered(prev => prev.map(c => c.id === rowId ? { ...c, zone } : c));
  }

  return (
    <>
      <SectionHeader title="Municipalities" subtitle="Select which Swedish municipalities you cover." />
      <div style={CARD}>
        <div style={{ position: 'relative' }}>
          <input type="text" placeholder="Search municipality..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 16px', fontSize: '13.5px', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117' }} />
          {showDropdown && (
            <div style={{ position: 'absolute', top: '46px', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #e8ede8', borderRadius: '12px', boxShadow: '0 4px 16px rgba(13,31,18,0.10)', zIndex: 10, overflow: 'hidden' }}>
              {filtered.map(m => (
                <div key={m} onClick={() => addMunicipality(m)}
                  style={{ padding: '10px 16px', fontSize: '13.5px', color: '#374151', cursor: 'pointer', fontFamily: FONT }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f4f6f4'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          {covered.length === 0 ? (
            <p style={{ fontSize: '13.5px', color: '#9ca3af', textAlign: 'center', padding: '20px 0', fontFamily: FONT }}>No municipalities added yet.</p>
          ) : covered.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f4f6f4' }}>
              <span style={{ flex: 1, fontSize: '13.5px', color: '#0d1117', fontWeight: '500', fontFamily: FONT }}>{c.municipality}</span>
              {[1, 2, 3].map(z => (
                <button key={z} type="button" onClick={() => changeZone(c.id, z)}
                  style={{ padding: '4px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT, border: c.zone === z ? 'none' : '1px solid #e8ede8', backgroundColor: c.zone === z ? (z === 1 ? PRIMARY : z === 2 ? '#1d4ed8' : '#7c3aed') : '#fff', color: c.zone === z ? '#fff' : '#6b7280' }}>
                  Zone {z}
                </button>
              ))}
              <button type="button" onClick={() => removeRow(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#dc2626', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
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
        </div>
      </div>
    </>
  );
}

export default function Municipalities() {
  const { profile } = useAuth();
  const clientId    = profile?.client_id;

  const [settingsRow,    setSettingsRow]    = useState(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [dataReady,      setDataReady]      = useState(false);

  useEffect(() => {
    if (!clientId) return;
    Promise.all([
      supabase.from('client_settings').select('*').eq('client_id', clientId).maybeSingle(),
      supabase.from('client_municipalities').select('*').eq('client_id', clientId),
    ]).then(([{ data: settings }, { data: muns }]) => {
      setSettingsRow(settings);
      setMunicipalities(muns || []);
      setDataReady(true);
    });
  }, [clientId]);

  return (
    <ClientLayout title="Municipalities">
      {!dataReady ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading…</div>
      ) : (
        <MunicipalitiesContent
          clientId={clientId}
          initialMunicipalities={municipalities}
          initialSettings={settingsRow}
        />
      )}
    </ClientLayout>
  );
}
