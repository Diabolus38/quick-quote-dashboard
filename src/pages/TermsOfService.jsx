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
    body: `By registering for and using QuickQuote360 ("the Service") you enter into a legally binding agreement with Christophe Hasley and agree to be bound by these Terms of Service.

If you do not agree to these Terms you may not use the Service. These Terms constitute the entire agreement between the Client and Christophe Hasley regarding use of the Service and supersede all prior agreements.`,
  },
  {
    id: 'description',
    num: '03',
    title: 'Description of Service',
    body: `QuickQuote360 is a web-based price estimation service for wastewater installation contractors. The Service includes:

• An embeddable estimation widget for your website
• A contractor dashboard for managing leads and settings
• Automated lead management and follow-up tools
• Automatic PDF quote generation and email delivery
• Multilingual support (English, Swedish, German, French)
• Analytics and reporting

The Service is provided on an "as is" and "as available" basis. We reserve the right to modify, add, or remove features with reasonable notice.`,
  },
  {
    id: 'registration',
    num: '04',
    title: 'Account Registration',
    body: `To use the Service you must register with a valid email address and provide accurate, complete information. You must:

• Be at least 18 years of age
• Be legally authorised to enter into binding contracts
• Maintain one account per person (accounts are non-transferable)
• Keep your login credentials confidential
• Notify us immediately at team@aiworldpartners.com if you suspect unauthorised access

You are responsible for all activity that occurs under your account.`,
  },
  {
    id: 'billing',
    num: '05',
    title: 'Subscription Plans and Billing',
    body: `The Service is available on the following subscription plans (prices in SEK, excluding VAT):

Starter — 1,400 kr/month or 14,000 kr/year
Includes unlimited estimates. No configuration options.

Growth — 3,000 kr/month or 30,000 kr/year
Includes 30 estimates per month. Overage: 250 kr per additional estimate.

Scale — 6,000 kr/month or 60,000 kr/year
Includes 75 estimates per month. Overage: 180 kr per additional estimate. Full branding customisation.

All subscriptions are billed in advance via Stripe. By subscribing you authorise us to charge your payment method on a recurring basis. Applicable Swedish VAT will be added to all prices.`,
  },
  {
    id: 'trial',
    num: '06',
    title: 'Free Trial',
    body: `New accounts receive a 14-day free trial of the Scale plan. No payment information is required during the trial period. At the end of the trial you must subscribe to a paid plan to continue using the Service.

Data created during the trial is retained for 30 days after the trial ends. Only one free trial is available per person or business. We reserve the right to modify or discontinue the free trial offer at any time.`,
  },
  {
    id: 'cancellation',
    num: '07',
    title: 'Cancellation and Refunds',
    body: `You may cancel your subscription at any time via the dashboard Settings page or by emailing team@aiworldpartners.com. Cancellation takes effect at the end of the current billing period; you retain access until that date.

No refunds are issued for partial billing periods, except in the following cases:
• The Service was unavailable for 72 or more consecutive hours due to a fault on our part
• A technical billing error resulted in an incorrect charge

EU consumers have a 14-day statutory right of withdrawal; however, by starting to use the Service immediately after subscription, you expressly waive this right. Installation and setup fees are non-refundable once the installation guide has been accessed.`,
  },
  {
    id: 'acceptable-use',
    num: '08',
    title: 'Acceptable Use',
    body: `You agree not to:

• Provide false or misleading estimates to customers
• Reverse engineer, decompile, or attempt to extract source code from the Service
• Share login credentials with other individuals
• Send unsolicited commercial communications (spam) via the Service
• Attempt to gain unauthorised access to any part of the Service or its infrastructure
• Take any action that damages, disables, or impairs the Service
• Resell or sublicense access to the Service without our written consent

Violation of these restrictions may result in immediate suspension or termination of your account without refund.`,
  },
  {
    id: 'intellectual-property',
    num: '09',
    title: 'Intellectual Property',
    body: `The Service and all associated software, content, logos, trademarks, and documentation are the exclusive property of Christophe Hasley / QuickQuote360. These Terms do not transfer any intellectual property rights to you.

You retain full ownership of:
• Content you upload to the Service (company name, logo, pricing data)
• Your customised question sets and widget configuration
• End customer data collected through the estimator widget

By uploading content you grant us a limited, non-exclusive licence to process and display it solely for the purpose of providing the Service.`,
  },
  {
    id: 'data-privacy',
    num: '10',
    title: 'Data and Privacy',
    body: `Your use of the Service is governed by our Privacy Policy, which forms part of these Terms.

You act as the data controller for personal data collected from your end customers through the estimator widget. QuickQuote360 acts as your data processor for that data. By using the Service, you confirm that you have a lawful basis for collecting and processing your customers' personal data in accordance with GDPR.

All personal data is stored on AWS EU North infrastructure in Stockholm, Sweden.`,
  },
  {
    id: 'liability',
    num: '11',
    title: 'Limitation of Liability',
    body: `To the fullest extent permitted by applicable law, QuickQuote360 is not liable for:

• Indirect, incidental, special, or consequential damages
• Loss of profits, revenue, or business opportunities
• Inaccuracies in estimates generated by the Service
• Technical failures, data loss, or service interruptions

The Service provides estimates only. You are solely responsible for the accuracy and completeness of any quotes or estimates provided to your customers.

Our total aggregate liability for any claim arising under these Terms shall not exceed the total fees you have paid to us in the 12 calendar months preceding the date the claim arose.`,
  },
  {
    id: 'availability',
    num: '12',
    title: 'Service Availability',
    body: `We aim to maintain high availability of the Service but do not guarantee uninterrupted access or a specific uptime percentage. We may perform scheduled maintenance with advance notice where practicable.

We are not liable for service disruptions caused by:
• Third-party infrastructure outages (hosting providers, payment processors)
• Internet connectivity failures beyond our control
• Force majeure events (natural disasters, pandemics, war, regulatory actions)`,
  },
  {
    id: 'changes',
    num: '13',
    title: 'Changes to Terms',
    body: `We may update these Terms at any time. For material changes, we will provide at least 30 days' notice by email to the address registered on your account.

Your continued use of the Service after the effective date of updated Terms constitutes your acceptance of the changes. If you do not accept updated Terms, you must cancel your subscription before the effective date.`,
  },
  {
    id: 'governing-law',
    num: '14',
    title: 'Governing Law and Disputes',
    body: `These Terms are governed by the laws of Sweden. Any dispute arising from these Terms shall first be subject to good-faith negotiation between the parties. If unresolved within 30 days, disputes shall be submitted to Strängnäs tingsrätt as the court of first instance.

EU consumers may also use the European Commission Online Dispute Resolution platform at ec.europa.eu/consumers/odr.`,
  },
  {
    id: 'contact',
    num: '15',
    title: 'Contact',
    body: `For questions about these Terms of Service:

Christophe Hasley
Kyrkogatan 7, Strängnäs, Sweden
Email: team@aiworldpartners.com`,
  },
];

export default function TermsOfService() {
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
          <h1 style={{ margin: '0 0 12px', fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>Terms of Service</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.65)' }}>
            Effective 26 June 2026 · Governing law: Sweden · Applies to European clients
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
              {SECTIONS.map(s => (
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
            {SECTIONS.map(s => (
              <div key={s.id} id={s.id} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', marginBottom: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e8ede8' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#a3e635', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>{s.num}</div>
                <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>{s.title}</h2>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.85', color: '#4b5563', whiteSpace: 'pre-line' }}>{s.body}</p>
              </div>
            ))}

            {/* Contact card */}
            <div style={{ backgroundColor: PRIMARY, borderRadius: '16px', padding: '32px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: '700', color: '#fff' }}>Questions about these Terms?</h2>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                We're happy to clarify anything. We'll respond within one business day.
              </p>
              <a href="mailto:team@aiworldpartners.com"
                style={{ display: 'inline-block', backgroundColor: '#a3e635', color: PRIMARY, padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
                team@aiworldpartners.com
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
