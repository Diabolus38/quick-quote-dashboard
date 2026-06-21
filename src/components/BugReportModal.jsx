import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const INP = { width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', fontFamily: FONT, outline: 'none', color: '#0d1117', backgroundColor: '#fff' };
const LBL = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT };

export default function BugReportModal({ isOpen, onClose }) {
  const { profile } = useAuth();
  const [category,      setCategory]      = useState('Display Issue');
  const [subject,       setSubject]       = useState('');
  const [description,   setDescription]   = useState('');
  const [steps,         setSteps]         = useState('');
  const [sending,       setSending]       = useState(false);
  const [sent,          setSent]          = useState(false);
  const [sendError,     setSendError]     = useState('');

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!subject.trim() || !description.trim()) return;
    setSending(true);
    setSendError('');
    const body = [
      `Category: ${category}`,
      `Subject: ${subject}`,
      ``,
      `Description:`,
      description,
      ``,
      `Steps to Reproduce:`,
      steps || '(not provided)',
      ``,
      `Reported by: ${profile?.full_name || 'Unknown'} (${profile?.email || 'no email'})`,
      `Page: ${window.location.href}`,
    ].join('\n');
    try {
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'team@aiworldpartners.com', subject: 'Bug Report: ' + subject, body }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => { setSent(false); setSubject(''); setDescription(''); setSteps(''); onClose(); }, 3000);
      } else {
        setSendError('Failed to send. Please try again.');
      }
    } catch {
      setSendError('Failed to send. Please try again.');
    }
    setSending(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '36px', width: '520px', maxWidth: '90vw', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>Report a Bug</h2>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#9ca3af' }}>Describe what happened and we will fix it as soon as possible.</p>

        {sent ? (
          <p style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#166534', padding: '24px 0' }}>Bug report sent! We will look into it shortly.</p>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={LBL}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
                <option>Display Issue</option>
                <option>Data Not Saving</option>
                <option>Feature Not Working</option>
                <option>Performance Issue</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={LBL}>Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of the issue" style={INP} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={LBL}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What happened? What did you expect to happen?"
                style={{ ...INP, minHeight: '120px', resize: 'vertical', padding: '9px 14px' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={LBL}>Steps to Reproduce <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span></label>
              <textarea value={steps} onChange={e => setSteps(e.target.value)} placeholder="1. Go to...\n2. Click on...\n3. See error"
                style={{ ...INP, minHeight: '80px', resize: 'vertical', padding: '9px 14px' }} />
            </div>
            {sendError && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#dc2626', fontWeight: '600', fontFamily: FONT }}>{sendError}</p>}
            <button type="button" onClick={handleSubmit} disabled={sending || !subject.trim() || !description.trim()}
              style={{ width: '100%', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: (sending || !subject.trim() || !description.trim()) ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: (sending || !subject.trim() || !description.trim()) ? 0.7 : 1 }}>
              {sending ? 'Sending…' : 'Submit'}
            </button>
            <button type="button" onClick={onClose} style={{ display: 'block', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', fontFamily: FONT, margin: '12px auto 0', padding: 0 }}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
