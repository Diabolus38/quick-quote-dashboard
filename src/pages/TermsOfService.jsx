import { useNavigate } from 'react-router-dom';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const SECTIONS = [
  {
    id: 'who-we-are',
    num: '01',
    title: 'Who We Are',
    body: `QuickQuote360 is a software-as-a-service platform operated by Christophe Hasley, a sole trader registered in Sweden.

Name: Christophe Hasley
Address: Kyrkogatan 7, Strängnäs, Sweden
Organisation number: 030516-5573
VAT number: SE030516557301
Contact: team@aiworldpartners.com`,
  },
  {
    id: 'acceptance',
    num: '02',
    title: 'Acceptance of Terms',
    body: `By accessing or using QuickQuote360 ("the Platform") you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform. These Terms constitute the entire agreement between you and QuickQuote360 regarding your use of the service.

Use of the Platform by your employees or agents is subject to these Terms and you are responsible for ensuring their compliance.`,
  },
  {
    id: 'description',
    num: '03',
    title: 'Description of Service',
    body: `QuickQuote360 provides a cloud-based platform that enables wastewater installation contractors to:

• Embed a customisable price-estimation widget on their website
• Automatically generate ballpark quotes for their customers
• Capture and manage leads from the widget
• Produce PDF quote documents
• Manage customer communications and pricing rules

The Platform is provided on an "as is" and "as available" basis. We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable advance notice where practicable.`,
  },
  {
    id: 'registration',
    num: '04',
    title: 'Account Registration',
    body: `To use the Platform you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.

You must notify us immediately at team@aiworldpartners.com if you suspect any unauthorised use of your account. You must be at least 18 years of age and legally authorised to enter into binding contracts. Accounts may not be shared between individuals.`,
  },
  {
    id: 'billing',
    num: '05',
    title: 'Subscription Plans and Billing',
    body: `The Platform is available on the following monthly subscription plans:

• Starter — 1,400 kr/month
• Growth — 3,000 kr/month
• Scale — 6,000 kr/month

All plans are billed monthly at the start of each billing period. Prices are stated exclusive of VAT; applicable Swedish VAT will be added. Payment is processed securely via Stripe. By subscribing, you authorise us to charge your payment method on a recurring monthly basis until you cancel.`,
  },
  {
    id: 'trial',
    num: '06',
    title: 'Free Trial',
    body: `New accounts receive a 14-day free trial of the Platform. No payment information is required during the trial period. At the end of the trial you must subscribe to a paid plan to continue using the Platform.

Features available during the trial may differ from those on paid plans. We reserve the right to modify or discontinue the free trial offer at any time.`,
  },
  {
    id: 'cancellation',
    num: '07',
    title: 'Cancellation and Refunds',
    body: `You may cancel your subscription at any time by contacting us at team@aiworldpartners.com or through your account settings. Cancellation takes effect at the end of the current billing period; you will retain access until that date.

We do not issue refunds for partial billing periods or for periods already paid. If you believe a charge was made in error, please contact us within 14 days of the charge and we will investigate promptly.`,
  },
  {
    id: 'acceptable-use',
    num: '08',
    title: 'Acceptable Use',
    body: `You agree not to use the Platform to:

• Violate any applicable law or regulation
• Misrepresent your business, services, or pricing to customers
• Send unsolicited commercial communications (spam)
• Attempt to gain unauthorised access to any part of the Platform or its infrastructure
• Engage in activity that damages, disables, or impairs the Platform
• Resell or sublicense access to the Platform without written permission from us

Violation of these restrictions may result in immediate suspension or termination of your account without refund.`,
  },
  {
    id: 'intellectual-property',
    num: '09',
    title: 'Intellectual Property',
    body: `The Platform and all associated software, content, logos, and trademarks are the exclusive property of Christophe Hasley / QuickQuote360. These Terms do not grant you any intellectual property rights in the Platform.

You retain ownership of all content you create or upload, including your pricing data and question customisations. By submitting content to the Platform you grant us a limited licence to process and display that content solely for the purpose of providing the service.`,
  },
  {
    id: 'data-privacy',
    num: '10',
    title: 'Data and Privacy',
    body: `You act as the data controller for the personal data of your end customers collected through the Platform's estimator widget. QuickQuote360 acts as your data processor for that data. By using the Platform, you confirm that you have a lawful basis for collecting and processing your customers' personal data.

Our full handling of personal data is described in our Privacy Policy, which forms part of these Terms.`,
  },
  {
    id: 'liability',
    num: '11',
    title: 'Limitation of Liability',
    body: `To the fullest extent permitted by law, QuickQuote360 shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of, or inability to use, the Platform.

Our total aggregate liability to you for any claim arising under these Terms shall not exceed the fees you have paid to us in the three (3) calendar months immediately preceding the date the claim arose.`,
  },
  {
    id: 'availability',
    num: '12',
    title: 'Service Availability',
    body: `We aim to maintain high availability of the Platform but do not guarantee uninterrupted access. We may perform scheduled maintenance with advance notice where possible. In the event of unplanned outages we will work to restore service as quickly as practicable.

We are not responsible for delays or failures caused by factors outside our reasonable control, including third-party service outages, internet connectivity failures, or force majeure events.`,
  },
  {
    id: 'changes',
    num: '13',
    title: 'Changes to Terms',
    body: `We may update these Terms at any time. When we make material changes, we will notify you by email or by displaying a notice within the Platform at least 14 days before the changes take effect.

Your continued use of the Platform after the effective date of updated Terms constitutes your acceptance of the changes. If you do not accept the updated Terms, you must cancel your subscription before the effective date.`,
  },
  {
    id: 'governing-law',
    num: '14',
    title: 'Governing Law and Disputes',
    body: `These Terms are governed by the laws of Sweden. Any dispute arising out of or in connection with these Terms shall be submitted to the exclusive jurisdiction of the Swedish courts.

If you have a complaint or dispute, please contact us first at team@aiworldpartners.com. We will make every effort to resolve disputes amicably before any legal proceedings are initiated.`,
  },
  {
    id: 'contact',
    num: '15',
    title: 'Contact',
    body: `For questions about these Terms of Service, please contact us:

Email: team@aiworldpartners.com
Post: Christophe Hasley, Kyrkogatan 7, Strängnäs, Sweden`,
  },
];

export default function TermsOfService() {
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
          <h1 style={{ margin: '0 0 10px', fontSize: '34px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>Terms of Service</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>
            Effective 1 January 2025 · Christophe Hasley · Org: 030516-5573 · VAT: SE030516557301
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
              <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#fff' }}>Questions about these Terms?</h2>
              <p style={{ margin: '0 0 18px', fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                We're happy to clarify anything. Reach out directly and we'll respond within one business day.
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
