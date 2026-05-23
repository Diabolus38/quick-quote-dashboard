import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';

const STATUS_COLORS = {
  'New':         '#1d4ed8',
  'Contacted':   '#d97706',
  'In Progress': '#7c3aed',
  'Closed Won':  '#16a34a',
  'Closed Lost': '#dc2626',
};

const STATUS_STAGES = ['New', 'Contacted', 'In Progress', 'Closed Won'];

function formatDate(str) {
  const d = new Date(str);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function card(extra = {}) {
  return {
    backgroundColor: '#fff',
    border: '1px solid #f0f0f0',
    borderRadius: '14px',
    padding: '20px',
    ...extra,
  };
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f7f7f7' }}>
      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#0d1117' }}>{value || '—'}</span>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead,     setLead]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notes,    setNotes]    = useState('');
  const [saveMsg,  setSaveMsg]  = useState('');

  useEffect(() => { fetchLead(); }, [id]);

  async function fetchLead() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      setNotFound(true);
    } else {
      setLead(data);
      setNotes(data.notes || '');
    }
    setLoading(false);
  }

  async function updateStatus(newStatus) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', id);
    setLead(prev => ({ ...prev, status: newStatus }));
  }

  async function saveNotes() {
    await supabase.from('leads').update({ notes }).eq('id', id);
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  if (loading) return (
    <ClientLayout title="Lead Detail">
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
    </ClientLayout>
  );

  if (notFound) return (
    <ClientLayout title="Lead Detail">
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626', fontSize: '14px' }}>Lead not found.</div>
    </ClientLayout>
  );

  const answers   = lead.answers || {};
  const stageIdx  = STATUS_STAGES.indexOf(lead.status);
  const isLost    = lead.status === 'Closed Lost';

  return (
    <ClientLayout title="Lead Detail">
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Back */}
          <button
            type="button"
            onClick={() => navigate('/client/leads')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0d3d2a', fontSize: '13px', fontWeight: '500', padding: 0, marginBottom: '16px' }}
          >
            ← Back to Leads
          </button>

          {/* Title + subtitle + status */}
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: '700', color: '#0d1117' }}>{lead.name || '—'}</h1>
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#9ca3af' }}>
            {[lead.email, lead.phone, lead.municipality].filter(Boolean).join(' · ')}
          </p>
          <select
            value={lead.status || 'New'}
            onChange={e => updateStatus(e.target.value)}
            style={{
              border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 10px',
              fontSize: '13px', color: STATUS_COLORS[lead.status] || '#374151',
              fontWeight: '600', backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
            }}
          >
            {['New', 'Contacted', 'In Progress', 'Closed Won', 'Closed Lost'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Contact Details */}
          <div style={card({ marginTop: '20px' })}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>Contact Details</p>
            <DetailRow label="Name"    value={lead.name}    />
            <DetailRow label="Email"   value={lead.email}   />
            <DetailRow label="Phone"   value={lead.phone}   />
            <DetailRow label="Company" value={lead.company} />
          </div>

          {/* Answers */}
          <div style={card({ marginTop: '20px' })}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>Answers</p>
            {Object.keys(answers).length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>No answers recorded.</p>
            ) : (
              Object.entries(answers).map(([key, val]) => {
                const label = key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f7f7f7' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
                    <span style={{ fontSize: '13px', color: '#0d1117' }}>{String(val)}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Notes */}
          <div style={card({ marginTop: '20px' })}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              style={{
                width: '100%', minHeight: '120px', boxSizing: 'border-box',
                border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px',
                fontSize: '13px', fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', color: '#374151',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={saveNotes}
                style={{ background: '#0d3d2a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit' }}
              >
                Save Notes
              </button>
              {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{saveMsg}</span>}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ width: '300px', flexShrink: 0 }}>

          {/* Estimate card */}
          <div style={card()}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Estimated Price
            </p>
            <p style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '700', color: '#0d3d2a', lineHeight: 1 }}>
              {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
              Submitted on {formatDate(lead.created_at)}
            </p>
          </div>

          {/* Actions card */}
          <div style={card({ marginTop: '16px' })}>
            <button type="button" style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '600', backgroundColor: '#0d3d2a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', fontFamily: 'inherit' }}>
              Download PDF
            </button>
            <button type="button" style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '500', backgroundColor: '#fff', color: '#0d1117', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Send Email
            </button>
          </div>

          {/* Status Timeline */}
          <div style={card({ marginTop: '16px' })}>
            <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>Status History</p>
            {STATUS_STAGES.map((stage, i) => {
              const isPast    = i < stageIdx && !isLost;
              const isCurrent = i === stageIdx && !isLost;
              const isFuture  = i > stageIdx || isLost;
              const dotColor  = isCurrent ? '#0d3d2a' : isPast ? '#9ca3af' : '#e5e7eb';
              const txtColor  = isCurrent ? '#0d3d2a' : isPast ? '#6b7280' : '#d1d5db';
              return (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < STATUS_STAGES.length - 1 ? '12px' : 0 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, backgroundColor: dotColor }} />
                  <span style={{ fontSize: '13px', color: txtColor, fontWeight: isCurrent ? '600' : '400', flex: 1 }}>{stage}</span>
                  {isCurrent && <span style={{ fontSize: '11px', color: '#0d3d2a', fontWeight: '600', backgroundColor: '#f0fdf4', padding: '2px 8px', borderRadius: '20px' }}>Current</span>}
                </div>
              );
            })}
            {isLost && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, backgroundColor: '#dc2626' }} />
                <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', flex: 1 }}>Closed Lost</span>
                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '20px' }}>Current</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </ClientLayout>
  );
}
