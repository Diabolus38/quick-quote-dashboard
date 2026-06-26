import { useNavigate } from 'react-router-dom';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const SECTIONS = [
  {
    id: 'who-we-are',
    num: '01',
    title: 'Who We Are',
    body: `QuickQuote360 is operated by Christophe Hasley, a sole trader registered in Sweden.

Name: Christophe Hasley
Address: Kyrkogatan 7, Strängnäs, Sweden
Organisation number: 030516-5573
VAT number: SE030516557301
Contact: team@aiworldpartners.com

For the personal data of our direct clients (contractors), we act as the data controller. For the personal data of end customers collected through client-embedded estimator widgets, we act as a data processor on behalf of the contractor.`,
  },
  {
    id: 'data-we-collect',
    num: '02',
    title: 'What Data We Collect',
    body: `About our direct clients (contractors) we collect:

• Full name and email address
• Business name and address
• Billing and payment information (processed by Stripe — we do not store full card numbers)
• Usage data and platform activity logs

We collect only what is necessary to provide and improve the service.`,
  },
  {
    id: 'end-customer-data',
    num: '03',
    title: 'Data We Collect About End Customers',
    body: `Through the estimator widget embedded on contractor websites, the following end-customer data is collected:

• Name, email address, and phone number
• Property address or municipality
• Project details submitted through the estimation form (e.g. property type, sewage type, distances)

This data is collected on behalf of and at the direction of the contractor (the data controller). QuickQuote360 processes this data solely to deliver the platform service.`,
  },
  {
    id: 'legal-basis',
    num: '04',
    title: 'Legal Basis for Processing',
    body: `We process personal data under the following legal bases as defined by GDPR Article 6:

• Article 6(1)(b) — processing necessary for the performance of a contract with our clients
• Article 6(1)(f) — processing necessary for our legitimate interests in operating and improving the platform
• Article 6(1)(a) — consent, where you have specifically opted in (e.g. non-essential cookies)`,
  },
  {
    id: 'how-we-use',
    num: '05',
    title: 'How We Use Your Data',
    body: `We use collected data to:

• Provide and maintain the QuickQuote360 platform
• Process payments and manage subscriptions
• Send service-related communications (account updates, billing receipts)
• Provide customer support
• Detect and prevent fraud and abuse
• Comply with applicable legal obligations

We do not sell your data to third parties. We do not use your data for advertising purposes.`,
  },
  {
    id: 'who-we-share-with',
    num: '06',
    title: 'Who We Share Data With',
    body: `We share data only with the following sub-processors, all operating under GDPR-compliant data processing agreements:

• Supabase (AWS EU-North, Stockholm, Sweden) — database, authentication, and file storage
• Stripe (EU operations, Ireland) — payment processing and subscription management
• Vercel (EU region, Frankfurt, Germany) — frontend hosting and CDN delivery
• Railway (EU region) — backend API hosting
• Anthropic (USA) — AI-powered translation features, accessed under Standard Contractual Clauses (SCCs) for third-country transfers
• Google Maps Platform (Google LLC) — address lookup and municipality search in the estimator widget

All sub-processors are required to process data only on our documented instructions.`,
  },
  {
    id: 'data-storage',
    num: '07',
    title: 'Where Data is Stored',
    body: `All primary database storage and authentication is hosted on Supabase infrastructure in Stockholm, Sweden (AWS EU-North region). Your data and your customers' data is stored within the European Economic Area (EEA) by default.

Data transferred to Anthropic (USA) for AI translation is processed transiently and not stored beyond the duration of the API request. Such transfers are covered by Standard Contractual Clauses in accordance with GDPR Article 46.`,
  },
  {
    id: 'retention',
    num: '08',
    title: 'How Long We Keep Data',
    body: `• Client account data is retained for the duration of the active subscription plus 30 days following account deletion.
• End-customer lead data is retained for as long as the associated client account is active; following account deletion, all lead data is permanently deleted within 30 days.
• Billing records are retained for 7 years in accordance with Swedish accounting law (Bokföringslagen).

You may request deletion of your data at any time by contacting us at team@aiworldpartners.com.`,
  },
  {
    id: 'gdpr-rights',
    num: '09',
    title: 'Your GDPR Rights',
    body: `As a data subject under GDPR, you have the following rights:

1. Right of access — request a copy of the personal data we hold about you
2. Right to rectification — request correction of any inaccurate personal data
3. Right to erasure — request deletion of your personal data ("right to be forgotten")
4. Right to data portability — receive your data in a machine-readable format
5. Right to object — object to processing based on legitimate interests
6. Right to restrict processing — request that we limit how we use your data
7. Right not to be subject to automated decision-making — we do not make solely automated decisions that produce legal or significant effects about you
8. Right to lodge a complaint — you may contact the Swedish Authority for Privacy Protection (IMY) at www.imy.se

To exercise any of these rights, contact us at team@aiworldpartners.com. We will respond within 30 days.`,
  },
  {
    id: 'cookies',
    num: '10',
    title: 'Cookies',
    body: `We use only technically necessary cookies required for:

• Authentication and session management
• Remembering your cookie consent preference

We do not use advertising cookies, tracking cookies, or any third-party analytics cookies. You can manage cookies through your browser settings, but disabling session cookies may prevent you from logging in to the Platform.`,
  },
  {
    id: 'children',
    num: '11',
    title: "Children's Privacy",
    body: `The Platform is intended for use by businesses and individuals aged 18 and over. We do not knowingly collect personal data from children under the age of 18.

If you believe a minor has provided us with personal data, please contact us at team@aiworldpartners.com and we will delete it promptly.`,
  },
  {
    id: 'changes',
    num: '12',
    title: 'Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we make significant changes, we will notify you by email or by posting a notice on the Platform at least 14 days before the changes take effect.

The date of the most recent revision is shown at the bottom of this page. Your continued use of the Platform after changes take effect constitutes acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    num: '13',
    title: 'Contact',
    body: `For any questions about this Privacy Policy or to exercise your data rights, contact us:

Email: team@aiworldpartners.com
Post: Christophe Hasley, Kyrkogatan 7, Strängnäs, Sweden

You also have the right to lodge a complaint with the Swedish data protection authority (Integritetsskyddsmyndigheten, IMY) at www.imy.se if you believe we have not handled your data correctly.`,
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8faf8', fontFamily: FONT }}>

      {/* Green header */}
      <div style={{ backgroundColor: PRIMARY, padding: '0 32px' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', backgroundColor: '#a3e635', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: PRIMARY }}>Q</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>QuickQuote360</span>
          </div>
          <button type="button" onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '13px', fontFamily: FONT, fontWeight: '500' }}>
            ← Back
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ backgroundColor: PRIMARY, padding: '36px 32px 56px' }}>
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#a3e635', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Legal</div>
          <h1 style={{ margin: '0 0 10px', fontSize: '34px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>Privacy Policy</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>
            Effective 1 January 2025 · GDPR-compliant · Data stored in Stockholm, Sweden
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '1060px', margin: '-28px auto 0', padding: '0 32px 64px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>

          {/* TOC */}
          <div style={{ width: '210px', flexShrink: 0, position: 'sticky', top: '24px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #e8ede8' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Contents</div>
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}
                  style={{ display: 'block', fontSize: '12px', color: '#6b7280', padding: '4px 0 4px 8px', textDecoration: 'none', lineHeight: 1.45, borderLeft: '2px solid #e8ede8', marginBottom: '1px', transition: 'all 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = PRIMARY; e.currentTarget.style.borderLeftColor = PRIMARY; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderLeftColor = '#e8ede8'; }}>
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {SECTIONS.map(s => (
              <div key={s.id} id={s.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '26px 28px', marginBottom: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', border: '1px solid #e8ede8' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#a3e635', letterSpacing: '0.1em', marginBottom: '5px' }}>{s.num}</div>
                <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700', color: '#0d1117' }}>{s.title}</h2>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.8', color: '#4b5563', whiteSpace: 'pre-line' }}>{s.body}</p>
              </div>
            ))}

            {/* Contact card */}
            <div style={{ backgroundColor: PRIMARY, borderRadius: '12px', padding: '26px 28px', marginBottom: '12px' }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#fff' }}>Questions about your data?</h2>
              <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                You can request access, correction, or deletion of your personal data at any time. We'll respond within 30 days.
              </p>
              <a href="mailto:team@aiworldpartners.com"
                style={{ display: 'inline-block', backgroundColor: '#a3e635', color: PRIMARY, padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                team@aiworldpartners.com
              </a>
            </div>

            {/* Page footer */}
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                Christophe Hasley · Kyrkogatan 7, Strängnäs, Sweden · Org: 030516-5573 · VAT: SE030516557301
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Last updated: January 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
