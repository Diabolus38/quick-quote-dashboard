import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const FONT    = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  padding: '24px',
};

const STATUS_BADGE = {
  new:          { bg: '#dbeafe', color: '#1d4ed8' },
  contacted:    { bg: '#fef9c3', color: '#854d0e' },
  in_progress:  { bg: '#ede9fe', color: '#7c3aed' },
  closed_won:   { bg: '#dcfce7', color: '#166534' },
  closed_lost:  { bg: '#fee2e2', color: '#991b1b' },
};

const PLAN_STYLE = {
  scale:   { bg: '#ecfccb', color: '#3f6212'  },
  growth:  { bg: '#ede9fe', color: '#7c3aed'  },
  starter: { bg: '#dbeafe', color: '#1d4ed8'  },
};

const PLAN_LIMIT = { starter: 30, growth: 75, scale: Infinity };

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function InfoRow({ label, children, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: last ? 'none' : '1px solid #f4f6f4' }}>
      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500', flexShrink: 0, marginRight: '16px' }}>{label}</span>
      <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500', textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function UsageBarDetail({ count, plan }) {
  if (plan === 'scale') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Usage</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#0d1117' }}>∞ Unlimited</span>
        </div>
        <div style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '99px' }}>
          <div style={{ width: `${count > 0 ? 30 : 0}%`, height: '100%', backgroundColor: LIME, borderRadius: '99px' }} />
        </div>
      </div>
    );
  }
  const limit = PLAN_LIMIT[plan] || 30;
  const pct   = Math.min(Math.round((count / limit) * 100), 100);
  const fill  = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : LIME;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Usage</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#0d1117' }}>{count} / {limit}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: fill, borderRadius: '99px' }} />
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [client,   setClient]   = useState(null);
  const [leads,    setLeads]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [notes,      setNotes]      = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const [copiedEmbed,  setCopiedEmbed]  = useState(false);
  const [copiedId,     setCopiedId]     = useState(false);
  const [resetMsg,     setResetMsg]     = useState('');
  const [changePlan,   setChangePlan]   = useState('');
  const [planSaved,    setPlanSaved]    = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    const [{ data: clientData, error: clientErr }, { data: leadsData }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ]);
    if (clientErr || !clientData) { setNotFound(true); setLoading(false); return; }
    setClient(clientData);
    setNotes(clientData.notes || '');
    setChangePlan(clientData.plan || 'starter');
    setLeads(leadsData || []);
    setLoading(false);
  }

  async function handleDeactivate() {
    const newActive = !client.active;
    await supabase.from('clients').update({ active: newActive }).eq('id', id);
    setClient(prev => ({ ...prev, active: newActive }));
  }

  async function handleSaveNotes() {
    await supabase.from('clients').update({ notes }).eq('id', id);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  async function handleSendReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(client.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetMsg(error ? 'Failed to send reset email.' : `Reset email sent to ${client.email}`);
    setTimeout(() => setResetMsg(''), 3000);
  }

  async function handleSavePlan() {
    await supabase.from('clients').update({ plan: changePlan }).eq('id', id);
    setClient(prev => ({ ...prev, plan: changePlan }));
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2000);
  }

  function copyEmbed() {
    const code = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${id}"></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    });
  }

  function copyClientId() {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  }

  if (loading) return (
    <Layout title="Client Detail">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      <div style={{ fontFamily: FONT }}>
        <div style={{ borderRadius: '8px', background: '#f0f0f0', height: '20px', width: '130px', marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '56px', marginBottom: '28px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '300px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '160px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '220px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div style={{ width: '300px', flexShrink: 0 }}>
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '220px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '180px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '200px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </Layout>
  );

  if (notFound) return (
    <Layout title="Client Detail">
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626', fontSize: '14px', fontFamily: FONT }}>Client not found.</div>
    </Layout>
  );

  const now            = new Date();
  const isActive       = client.active !== false;
  const planStyle      = PLAN_STYLE[client.plan] || PLAN_STYLE.starter;
  const recentLeads    = leads.slice(0, 5);
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const avgPrice = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.length)
    : null;
  const limit = client.plan === 'scale' ? '∞ Unlimited' : (PLAN_LIMIT[client.plan] || 30);
  const embedCode = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${id}"></script>`;

  const BTN_PRIMARY   = { backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, width: '100%', marginBottom: '8px' };
  const BTN_SECONDARY = { backgroundColor: '#fff', border: '1px solid #e8ede8', color: '#0d1117', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT, width: '100%', marginBottom: '8px' };
  const BTN_DANGER    = { backgroundColor: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, width: '100%', marginBottom: '8px' };

  return (
    <Layout title="Client Detail">
      <div style={{ fontFamily: FONT }}>

        {/* ── Back ── */}
        <button type="button" onClick={() => navigate('/admin/clients')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, marginBottom: '20px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Clients
        </button>

        {/* ── Title Row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>{client.name}</h1>
            <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: planStyle.bg, color: planStyle.color }}>
              {capitalize(client.plan)}
            </span>
            <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#166534' : '#dc2626' }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={copyEmbed}
              style={{ backgroundColor: copiedEmbed ? '#ecfccb' : '#fff', border: '1px solid #e8ede8', color: copiedEmbed ? '#3f6212' : '#0d1117', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}>
              {copiedEmbed ? '✓ Copied!' : 'Copy Embed Code'}
            </button>
            <button type="button" onClick={async () => {
              const { error } = await supabase.auth.resetPasswordForEmail(client.email, { redirectTo: window.location.origin + '/login' });
              setResetMsg(error ? 'Failed to send reset email.' : `Reset email sent to ${client.email}`);
              setTimeout(() => setResetMsg(''), 3000);
            }}
              style={{ backgroundColor: '#fff', border: '1px solid #e8ede8', color: '#0d1117', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
              Reset Password
            </button>
            {resetMsg && <span style={{ fontSize: '12px', color: resetMsg.includes('Failed') ? '#dc2626' : '#16a34a', fontWeight: '600', fontFamily: FONT, alignSelf: 'center' }}>{resetMsg}</span>}
            <a href={`https://estimator.quickquote360.com?clientId=${id}`} target="_blank" rel="noopener noreferrer"
              style={{ backgroundColor: '#fff', border: '1px solid #e8ede8', color: '#0d1117', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              View Live Tool →
            </a>
            <button type="button" onClick={handleDeactivate}
              style={{ backgroundColor: isActive ? '#fff' : PRIMARY, border: isActive ? '1px solid #dc2626' : 'none', color: isActive ? '#dc2626' : '#fff', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* ── LEFT ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Account Details */}
            <div style={CARD}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Account Details</p>
              <InfoRow label="Company Name">{client.name || '—'}</InfoRow>
              <InfoRow label="Email">{client.email || '—'}</InfoRow>
              <InfoRow label="Website URL">
                {client.website_url
                  ? <a href={client.website_url} target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY, textDecoration: 'none', fontWeight: '500' }}>{client.website_url}</a>
                  : '—'}
              </InfoRow>
              <InfoRow label="Plan">{capitalize(client.plan)}</InfoRow>
              <InfoRow label="Status">{isActive ? 'Active' : 'Inactive'}</InfoRow>
              <InfoRow label="Signed Up">{formatDate(client.created_at)}</InfoRow>
              <InfoRow label="Client ID" last>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '11px', backgroundColor: '#f4f6f4', padding: '3px 8px', borderRadius: '6px', color: '#374151', fontFamily: 'monospace' }}>{id}</code>
                  <button type="button" onClick={copyClientId}
                    style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: copiedId ? '#166534' : '#374151', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
                    {copiedId ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </InfoRow>
            </div>

            {/* Internal Notes */}
            <div style={{ ...CARD, marginTop: '16px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Internal Notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add internal notes about this client…"
                style={{ width: '100%', boxSizing: 'border-box', height: '100px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: FONT, outline: 'none', color: '#0d1117', resize: 'vertical' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={handleSaveNotes}
                  style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                  Save Notes
                </button>
                {notesSaved && <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>✓ Saved!</span>}
              </div>
            </div>

            {/* Recent Leads */}
            <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Leads</span>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#374151' }}>{leads.length}</span>
                </div>
              </div>
              {recentLeads.length === 0 ? (
                <p style={{ margin: 0, padding: '40px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>No leads yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa' }}>
                      {['Customer Name','Email','Price','Date','Status'].map(col => (
                        <th key={col} style={{ textAlign: 'left', padding: '10px 20px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead, i) => {
                      const rawStatus = (lead.status || 'new').toLowerCase().replace(/\s+/g, '_');
                      const sb        = STATUS_BADGE[rawStatus] || { bg: '#f3f4f6', color: '#6b7280' };
                      return (
                        <tr key={lead.id}
                          style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid #f4f6f4' : 'none', cursor: 'default' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9faf9'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                          <td style={{ padding: '12px 20px', fontWeight: '600', color: '#0d1117', fontSize: '13px' }}>{lead.name || '—'}</td>
                          <td style={{ padding: '12px 20px', color: '#9ca3af', fontSize: '13px' }}>{lead.email || '—'}</td>
                          <td style={{ padding: '12px 20px', fontWeight: '600', color: '#0d1117', fontSize: '13px' }}>
                            {lead.estimated_price != null ? `$${Number(lead.estimated_price).toLocaleString()}` : '—'}
                          </td>
                          <td style={{ padding: '12px 20px', color: '#9ca3af', fontSize: '13px' }}>{formatDate(lead.created_at)}</td>
                          <td style={{ padding: '12px 20px', fontSize: '13px' }}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: sb.bg, color: sb.color }}>
                              {lead.status || 'New'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ width: '300px', flexShrink: 0 }}>

            {/* Quick Stats */}
            <div style={CARD}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Quick Stats</p>
              {[
                { label: 'Total Leads',       value: leads.length },
                { label: 'Leads This Month',  value: thisMonthLeads.length },
                { label: 'Avg Estimate Value', value: avgPrice != null ? `$${avgPrice.toLocaleString()}` : '—' },
                { label: 'Plan Limit',         value: typeof limit === 'number' ? limit : limit },
              ].map(({ label, value }, idx, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: idx < arr.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117' }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: '16px' }}>
                <UsageBarDetail count={leads.length} plan={client.plan} />
              </div>
            </div>

            {/* Embed Code */}
            <div style={{ ...CARD, marginTop: '16px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Embed Code</p>
              <div style={{ backgroundColor: '#0d1117', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px', overflowX: 'auto' }}>
                <code style={{ fontSize: '11px', color: '#a3e635', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.6' }}>
                  {embedCode}
                </code>
              </div>
              <button type="button" onClick={copyEmbed}
                style={{ width: '100%', backgroundColor: copiedEmbed ? '#ecfccb' : '#fff', border: '1px solid #e8ede8', color: copiedEmbed ? '#3f6212' : '#0d1117', borderRadius: '10px', padding: '9px 0', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', marginBottom: '10px' }}>
                {copiedEmbed ? '✓ Copied!' : 'Copy Code'}
              </button>
              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Paste this before &lt;/body&gt; on their website</p>
            </div>

            {/* Actions */}
            <div style={{ ...CARD, marginTop: '16px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Actions</p>

              <button type="button" onClick={handleSendReset} style={BTN_SECONDARY}>
                Send Password Reset Email
              </button>

              {resetMsg && <p style={{ fontSize: '12px', color: resetMsg.includes('Failed') ? '#dc2626' : '#166534', marginBottom: '8px', fontFamily: FONT }}>{resetMsg}</p>}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT }}>Change Plan</label>
                <select value={changePlan} onChange={e => setChangePlan(e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: FONT, outline: 'none', backgroundColor: '#fff', color: '#0d1117', marginBottom: '8px' }}>
                  <option value="starter">Starter — $300/mo</option>
                  <option value="growth">Growth — $600/mo</option>
                  <option value="scale">Scale — $1,149/mo</option>
                </select>
                <button type="button" onClick={handleSavePlan}
                  style={{ width: '100%', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 0', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                  {planSaved ? '✓ Plan Saved!' : 'Save Plan'}
                </button>
              </div>

              <button type="button" onClick={() => navigate('/client')} style={BTN_PRIMARY}>
                Go to Client View
              </button>

              <button type="button" onClick={handleDeactivate} style={BTN_DANGER}>
                {isActive ? 'Deactivate Account' : 'Reactivate Account'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
