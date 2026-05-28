import { useNavigate } from 'react-router-dom';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: 'QuickQuote360, operated under Swedish law, processes personal data on behalf of our clients (wastewater contractors). We act as a data processor for the end-user data collected through our embedded estimator tools, and as a data controller for the account data of our direct clients.',
  },
  {
    title: '2. What Data We Collect',
    body: 'Through our platform we collect:\n\n• Names, email addresses, phone numbers, and project details submitted by end users through client-embedded estimator tools.\n• Account data for our direct clients (contractors), including name, email address, and billing information.\n\nWe do not collect any data beyond what is necessary to provide the service.',
  },
  {
    title: '3. Legal Basis for Processing',
    body: 'We process personal data under the following legal bases as defined by GDPR:\n\n• Article 6(1)(b) — Processing necessary for the performance of a contract.\n• Article 6(1)(f) — Processing necessary for our legitimate interests in providing and improving the platform.',
  },
  {
    title: '4. Data Storage',
    body: 'All data is stored in the European Union via Supabase infrastructure. We do not transfer personal data outside the EEA without appropriate safeguards in place.',
  },
  {
    title: '5. Your Rights Under GDPR',
    body: 'You have the right to:\n\n• Access your personal data\n• Correct inaccurate data\n• Request deletion of your data\n• Export your data in a portable format\n• Object to or restrict processing\n\nTo exercise any of these rights, contact us at support@quickquote360.com. We will respond within 30 days.',
  },
  {
    title: '6. Data Retention',
    body: 'Lead data is retained for as long as the associated client account remains active. Upon account deletion, all associated personal data is permanently deleted within 30 days.',
  },
  {
    title: '7. Third Party Processors',
    body: 'We use the following third-party processors to deliver our service:\n\n• Supabase — database and authentication\n• Railway — backend hosting\n• Resend — email delivery\n• Vercel — frontend hosting\n\nAll processors are contractually bound to handle data in accordance with GDPR.',
  },
  {
    title: '8. Cookies',
    body: 'We use only essential cookies required for authentication and session management. We do not use tracking cookies, advertising cookies, or any third-party analytics cookies.',
  },
  {
    title: '9. Contact',
    body: 'If you have questions about this privacy policy or wish to exercise your rights, please contact us at support@quickquote360.com.',
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: FONT, padding: '40px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Back */}
        <button type="button" onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, marginBottom: '24px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back
        </button>

        {/* Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '48px' }}>

          {/* Header */}
          <div style={{ marginBottom: '36px', paddingBottom: '24px', borderBottom: '1px solid #e8ede8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#a3e635', fontFamily: FONT }}>Q</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#111827', fontFamily: FONT }}>QuickQuote360</span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', fontFamily: FONT }}>Privacy Policy</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', fontFamily: FONT }}>How we collect, use, and protect your personal data.</p>
          </div>

          {/* Sections */}
          {SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom: '32px' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{section.title}</h2>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.8', color: '#4b5563', fontFamily: FONT, whiteSpace: 'pre-line' }}>{section.body}</p>
            </div>
          ))}

          {/* Footer */}
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Last updated: January 2025</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#a3e635', fontFamily: FONT }}>Q</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827', fontFamily: FONT }}>QuickQuote360</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
