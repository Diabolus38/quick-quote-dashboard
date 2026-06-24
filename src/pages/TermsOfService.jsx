import { useNavigate } from 'react-router-dom';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const SECTIONS = [
  {
    title: '1. Service Description',
    body: 'QuickQuote360 is a SaaS platform that provides embeddable estimation tools and lead capture for wastewater contractors. The platform allows contractors to embed a customizable estimator widget on their website to generate leads and price estimates.',
  },
  {
    title: '2. Subscription and Billing',
    body: `Plans are billed monthly. The following plans are available:\n\n• Starter — 1,400 kr/mo (unlimited estimates)\n• Growth — 3,000 kr/mo (30 estimates per month)\n• Scale — 6,000 kr/mo (75 estimates per month)\n\nOverages are charged at the end of each billing period. No refunds are issued on monthly subscriptions once a billing period has commenced.`,
  },
  {
    title: '3. Acceptable Use',
    body: 'You may not use the platform for illegal purposes, to send spam or unsolicited communications, or to misrepresent your business or the services you offer. Violation of these restrictions may result in immediate account suspension.',
  },
  {
    title: '4. Data and Privacy',
    body: 'You remain the data controller for your customers\' personal data collected through the estimator tool. QuickQuote360 acts as a data processor on your behalf. See our Privacy Policy for full details on how personal data is handled.',
  },
  {
    title: '5. Termination',
    body: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or fail to maintain payment obligations. You may cancel your subscription at any time by contacting support.',
  },
  {
    title: '6. Limitation of Liability',
    body: 'QuickQuote360 is not liable for indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability to you shall not exceed the fees paid in the three months preceding the claim.',
  },
  {
    title: '7. Governing Law',
    body: 'These terms are governed by and construed in accordance with the laws of Sweden. Any disputes shall be resolved in the courts of Sweden.',
  },
  {
    title: '8. Contact',
    body: 'If you have questions about these terms, please contact us at support@quickquote360.com.',
  },
];

export default function TermsOfService() {
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
            <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', fontFamily: FONT }}>Terms of Service</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', fontFamily: FONT }}>Please read these terms carefully before using our platform.</p>
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
