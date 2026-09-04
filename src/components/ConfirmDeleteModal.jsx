import { useState, useEffect } from 'react';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

// Type-to-confirm modal for destructive actions (GitHub/Vercel style).
// The red button stays disabled until the user types the required word exactly,
// so a stray click can never destroy data.
export default function ConfirmDeleteModal({ open, title, message, requiredText = 'DELETE', confirmLabel = 'Delete', onConfirm, onCancel }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (open) setTyped(''); }, [open]);
  if (!open) return null;
  const match = typed === requiredText;
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,17,23,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', fontFamily: FONT }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: '800', color: '#dc2626' }}>{title}</h3>
        <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#374151', lineHeight: 1.6 }}>{message}</p>
        <p style={{ margin: '0 0 8px', fontSize: '12.5px', color: '#6b7280' }}>Type <strong style={{ color: '#0d1117' }}>{requiredText}</strong> to confirm:</p>
        <input autoFocus value={typed} onChange={e => setTyped(e.target.value)} placeholder={requiredText}
          onKeyDown={e => { if (e.key === 'Enter' && match) onConfirm(); if (e.key === 'Escape') onCancel(); }}
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e8ede8', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: FONT, outline: 'none', marginBottom: '18px' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onCancel}
            style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            Cancel
          </button>
          <button type="button" disabled={!match} onClick={() => { if (match) onConfirm(); }}
            style={{ border: 'none', backgroundColor: match ? '#dc2626' : '#fca5a5', color: '#fff', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: match ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
