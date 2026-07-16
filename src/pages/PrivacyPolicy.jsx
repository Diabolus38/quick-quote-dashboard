import { useNavigate } from 'react-router-dom';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

function TableRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '8px 0', borderBottom: '1px solid #f4f6f4', fontSize: '13.5px', fontFamily: FONT }}>
      <span style={{ width: '200px', flexShrink: 0, fontWeight: '600', color: '#374151' }}>{label}</span>
      <span style={{ color: '#4b5563', lineHeight: 1.55 }}>{value}</span>
    </div>
  );
}

function SectionCard({ id, num, title, children }) {
  return (
    <div id={id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', marginBottom: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e8ede8' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: '#a3e635', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>{num}</div>
      <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>{title}</h2>
      {children}
    </div>
  );
}

function Body({ children }) {
  return <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: '1.85', color: '#4b5563', whiteSpace: 'pre-line' }}>{children}</p>;
}

const TOC = [
  { id: 'who-we-are',       title: 'Who We Are' },
  { id: 'dashboard-data',   title: 'Dashboard User Data' },
  { id: 'customer-data',    title: 'End Customer Data' },
  { id: 'legal-basis',      title: 'Legal Basis' },
  { id: 'how-we-use',       title: 'How We Use Data' },
  { id: 'sharing',          title: 'Who We Share With' },
  { id: 'storage',          title: 'Data Storage' },
  { id: 'retention',        title: 'Retention' },
  { id: 'gdpr-rights',      title: 'Your GDPR Rights' },
  { id: 'cookies',          title: 'Cookies' },
  { id: 'children',         title: "Children's Privacy" },
  { id: 'changes',          title: 'Changes' },
  { id: 'contact',          title: 'Contact' },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8faf8', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ backgroundColor: PRIMARY, padding: '0 32px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
      <div style={{ backgroundColor: PRIMARY, padding: '40px 32px 60px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#a3e635', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Legal</div>
          <h1 style={{ margin: '0 0 12px', fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>Privacy Policy</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>
            Effective 26 June 2026 · GDPR compliant · Data hosted in Stockholm, Sweden
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '1080px', margin: '-32px auto 0', padding: '0 32px 80px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

          {/* TOC */}
          <div style={{ width: '220px', flexShrink: 0, position: 'sticky', top: '24px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px 18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e8ede8' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>Contents</div>
              {TOC.map(s => (
                <a key={s.id} href={`#${s.id}`}
                  style={{ display: 'block', fontSize: '12px', color: '#6b7280', padding: '5px 0 5px 10px', textDecoration: 'none', lineHeight: 1.4, borderLeft: '2px solid #e8ede8', marginBottom: '2px' }}
                  onMouseEnter={e => { e.currentTarget.style.color = PRIMARY; e.currentTarget.style.borderLeftColor = PRIMARY; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderLeftColor = '#e8ede8'; }}>
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div style={{ flex: 1, minWidth: 0 }}>

            <SectionCard id="who-we-are" num="01" title="Who We Are">
              <Body>{`QuickQuote360 is operated by Christophe Hasley, a sole trader registered in Sweden.

Name: Christophe Hasley
Address: Kyrkogatan 7, Strängnäs, Sweden
Organisation number: 030516-5573
VAT number: SE030516557301
Contact: team@quickquote360.com

We act as the data controller for personal data of registered dashboard users (contractors). We act as a data processor on behalf of contractors for personal data collected from end customers through the estimator widget.`}</Body>
            </SectionCard>

            <SectionCard id="dashboard-data" num="02" title="What Data We Collect (Dashboard Users)">
              <Body>We collect the following information about registered contractors:</Body>
              <TableRow label="Full name" value="Used for account identification" />
              <TableRow label="Email address" value="Used for login and billing communications" />
              <TableRow label="Company name" value="Used for widget personalisation" />
              <TableRow label="Company address" value="Used for travel calculation and invoicing" />
              <TableRow label="Organisation number" value="Used for invoicing" />
              <TableRow label="Billing information" value="Processed by Stripe. We retain billing records for 7 years per Bokföringslagen." />
              <TableRow label="Logo and branding assets" value="Stored in Supabase Storage for widget display" />
              <TableRow label="Pricing and configuration data" value="Stored in Supabase database" />
              <div style={{ display: 'flex', gap: '16px', padding: '8px 0', fontSize: '13.5px', fontFamily: FONT }}>
                <span style={{ width: '200px', flexShrink: 0, fontWeight: '600', color: '#374151' }}>Usage logs</span>
                <span style={{ color: '#4b5563', lineHeight: 1.55 }}>Retained for 12 months for fraud prevention and service improvement</span>
              </div>
            </SectionCard>

            <SectionCard id="customer-data" num="03" title="End Customer Data">
              <Body>Through the estimator widget embedded on contractor websites, the following data is collected on behalf of the contractor:</Body>
              <TableRow label="Name" value="Required for quote generation" />
              <TableRow label="Email address" value="Required for quote delivery" />
              <TableRow label="Phone number" value="Optional, provided by customer" />
              <TableRow label="Company name" value="Optional, provided by customer" />
              <TableRow label="Organisation number" value="Optional, provided by customer" />
              <TableRow label="Municipality" value="Required for pricing calculation" />
              <TableRow label="Project question answers" value="Required for estimate calculation" />
              <TableRow label="Estimated cost" value="Generated by the Service" />
              <TableRow label="IP address" value="Collected for fraud prevention only" />
              <div style={{ display: 'flex', gap: '16px', padding: '8px 0', fontSize: '13.5px', fontFamily: FONT }}>
                <span style={{ width: '200px', flexShrink: 0, fontWeight: '600', color: '#374151' }}>Timestamp</span>
                <span style={{ color: '#4b5563', lineHeight: 1.55 }}>Date and time of submission</span>
              </div>
            </SectionCard>

            <SectionCard id="legal-basis" num="04" title="Legal Basis for Processing">
              <Body>{`We process personal data under the following legal bases (GDPR Article 6):

Contract performance — Art 6(1)(b)
Processing account and billing data necessary to provide the Service you signed up for.

Legitimate interests — Art 6(1)(f)
Processing usage logs for fraud prevention and service improvement.

Legal obligation — Art 6(1)(c)
Retaining billing records for 7 years as required by Swedish accounting law (Bokföringslagen).

Consent — Art 6(1)(a)
Marketing communications, where you have explicitly opted in.`}</Body>
            </SectionCard>

            <SectionCard id="how-we-use" num="05" title="How We Use Your Data">
              <Body>{`We use collected data to:

• Provide and maintain the QuickQuote360 Service
• Process payments and manage subscriptions
• Send service-related notifications (account updates, billing receipts)
• Respond to support requests
• Detect and prevent fraud and abuse
• Comply with applicable legal obligations
• Improve the Service (using anonymised usage data)

We never sell your data. We never use your data for advertising purposes.`}</Body>
            </SectionCard>

            <SectionCard id="sharing" num="06" title="Who We Share Data With">
              <Body>We share data only with the following sub-processors under GDPR-compliant data processing agreements:</Body>
              <TableRow label="Supabase / AWS" value="Database, authentication, file storage — EU North region, Stockholm, Sweden" />
              <TableRow label="Stripe" value="Payment processing and subscription management — EU operations, Ireland" />
              <TableRow label="Vercel" value="Dashboard hosting and CDN — EU region, Frankfurt, Germany" />
              <TableRow label="Railway" value="Backend API hosting — EU region" />
              <TableRow label="Anthropic" value="Question translation only (question text, not personal data) — USA, covered by Standard Contractual Clauses (SCCs)" />
              <div style={{ display: 'flex', gap: '16px', padding: '8px 0', fontSize: '13.5px', fontFamily: FONT }}>
                <span style={{ width: '200px', flexShrink: 0, fontWeight: '600', color: '#374151' }}>Google Maps Platform</span>
                <span style={{ color: '#4b5563', lineHeight: 1.55 }}>Address autocomplete in the estimator widget — EU infrastructure where possible</span>
              </div>
            </SectionCard>

            <SectionCard id="storage" num="07" title="Data Storage">
              <Body>{`All personal data is stored on Supabase infrastructure running on AWS EU North in Stockholm, Sweden. This means your data stays within the European Economic Area (EEA) by default.

Payment data is held exclusively by Stripe, which is PCI DSS Level 1 certified.

Question text sent to Anthropic for AI translation is processed transiently under Standard Contractual Clauses (GDPR Article 46) and is not stored beyond the duration of the API request. This text does not contain personal data.`}</Body>
            </SectionCard>

            <SectionCard id="retention" num="08" title="How Long We Keep Data">
              <TableRow label="Account data" value="For the duration of the active subscription plus 30 days after deletion" />
              <TableRow label="Lead / customer data" value="While the associated client account is active. Deletable by the contractor at any time." />
              <TableRow label="Billing records" value="7 years, as required by Bokföringslagen (Swedish accounting law)" />
              <TableRow label="Usage logs" value="12 months" />
              <div style={{ display: 'flex', gap: '16px', padding: '8px 0', fontSize: '13.5px', fontFamily: FONT }}>
                <span style={{ width: '200px', flexShrink: 0, fontWeight: '600', color: '#374151' }}>Trial data</span>
                <span style={{ color: '#4b5563', lineHeight: 1.55 }}>Retained for 30 days after the trial ends, then permanently deleted</span>
              </div>
            </SectionCard>

            <SectionCard id="gdpr-rights" num="09" title="Your GDPR Rights">
              <Body>As a data subject under GDPR you have the following rights. Contact us at team@quickquote360.com to exercise any of them — we will respond within 30 days.</Body>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { right: 'Access', desc: 'Request a copy of personal data we hold about you' },
                  { right: 'Rectification', desc: 'Request correction of inaccurate personal data' },
                  { right: 'Erasure', desc: 'Request deletion of your personal data' },
                  { right: 'Restriction', desc: 'Request that we limit how we process your data' },
                  { right: 'Data Portability', desc: 'Receive your data in a machine-readable format' },
                  { right: 'Object', desc: 'Object to processing based on legitimate interests' },
                  { right: 'Withdraw Consent', desc: 'Withdraw consent for consent-based processing at any time' },
                  { right: 'Not to be Profiled', desc: 'We do not make solely automated decisions with legal effects about you' },
                ].map(item => (
                  <div key={item.right} style={{ backgroundColor: '#f8faf8', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e8ede8' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: PRIMARY, marginBottom: '4px' }}>{item.right}</div>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
              <Body>You also have the right to lodge a complaint with the Swedish Authority for Privacy Protection (IMY) at imy.se if you believe we have not handled your data correctly.</Body>
            </SectionCard>

            <SectionCard id="cookies" num="10" title="Cookies">
              <Body>{`We use only the following:

Authentication cookies — Essential. Set by Supabase to keep you logged in to the dashboard.
Local storage — Used for UI preferences only. Contains no personal data.

We do not use:
• Google Analytics or any behavioural analytics
• Facebook Pixel or any social media tracking
• Advertising or retargeting cookies
• Any third-party tracking scripts

The estimator widget embedded on your website sets no cookies on your visitors.`}</Body>
            </SectionCard>

            <SectionCard id="children" num="11" title="Children's Privacy">
              <Body>The Service is not directed at individuals under the age of 16. We do not knowingly collect personal data from children. If you believe a child under 16 has submitted data through the Service, please contact us at team@quickquote360.com and we will delete it promptly.</Body>
            </SectionCard>

            <SectionCard id="changes" num="12" title="Changes to This Policy">
              <Body>We may update this Privacy Policy from time to time. For significant changes, we will provide at least 30 days' notice by email. The updated policy will be published at quickquote360.com/privacy. Your continued use of the Service after the effective date constitutes acceptance of the updated policy.</Body>
            </SectionCard>

            <SectionCard id="contact" num="13" title="Contact and Complaints">
              <Body>{`For any questions about this Privacy Policy or to exercise your data rights:

Christophe Hasley
Kyrkogatan 7, Strängnäs, Sweden
Email: team@quickquote360.com`}</Body>
              <div style={{ backgroundColor: '#f8faf8', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e8ede8' }}>
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Swedish Data Protection Authority (IMY)</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.6, fontFamily: FONT }}>
                  Website: imy.se<br />
                  Email: imy@imy.se<br />
                  Phone: +46 8 657 61 00
                </p>
              </div>
            </SectionCard>

            {/* Contact card */}
            <div style={{ backgroundColor: PRIMARY, borderRadius: '16px', padding: '32px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: '700', color: '#fff' }}>Questions about your data?</h2>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                You can request access, correction, or deletion of your personal data at any time. We'll respond within 30 days.
              </p>
              <a href="mailto:team@quickquote360.com"
                style={{ display: 'inline-block', backgroundColor: '#a3e635', color: PRIMARY, padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
                team@quickquote360.com
              </a>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Christophe Hasley · Kyrkogatan 7, Strängnäs, Sweden · Org: 030516-5573 · VAT: SE030516557301</span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Last updated: June 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
