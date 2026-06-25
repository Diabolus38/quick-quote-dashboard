import { useState, useEffect } from 'react';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const SECTIONS = [
  { id: 'before-you-start', label: 'Before You Start' },
  { id: 'wordpress',        label: 'WordPress' },
  { id: 'webflow',          label: 'Webflow' },
  { id: 'squarespace',      label: 'Squarespace' },
  { id: 'wix',              label: 'Wix' },
  { id: 'custom-html',      label: 'Custom HTML / Static Sites' },
  { id: 'react-nextjs-vue', label: 'React / Next.js / Vue' },
  { id: 'troubleshooting',  label: 'Troubleshooting' },
  { id: 'verifying',        label: 'Verifying Installation' },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function CodeBlock({ children }) {
  return (
    <pre style={{ backgroundColor: '#0d1117', color: LIME, fontFamily: 'monospace', borderRadius: '10px', padding: '16px', overflowX: 'auto', fontSize: '13px', lineHeight: '1.7', margin: '10px 0 0', whiteSpace: 'pre' }}>
      {children}
    </pre>
  );
}

function StepList({ steps }) {
  return (
    <ol style={{ paddingLeft: '22px', margin: '8px 0 0' }}>
      {steps.map((s, i) => (
        <li key={i} style={{ margin: '7px 0', fontSize: '13.5px', color: '#374151', fontFamily: FONT, lineHeight: '1.6' }}>{s}</li>
      ))}
    </ol>
  );
}

function BulletList({ items }) {
  return (
    <ul style={{ paddingLeft: '22px', margin: '8px 0 0' }}>
      {items.map((s, i) => (
        <li key={i} style={{ margin: '7px 0', fontSize: '13.5px', color: '#374151', fontFamily: FONT, lineHeight: '1.6' }}>{s}</li>
      ))}
    </ul>
  );
}

function H3({ children }) {
  return <p style={{ margin: '22px 0 6px', fontSize: '14px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{children}</p>;
}

function Warn({ children }) {
  return (
    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', margin: '14px 0 0' }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontFamily: FONT, lineHeight: '1.6' }}>{children}</p>
    </div>
  );
}

function Tip({ children }) {
  return (
    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', margin: '10px 0 0' }}>
      <p style={{ margin: 0, fontSize: '13px', color: PRIMARY, fontFamily: FONT, lineHeight: '1.6' }}>{children}</p>
    </div>
  );
}

function SectionCard({ id, number, title, children }) {
  return (
    <div id={id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '32px', marginBottom: '24px', scrollMarginTop: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0, fontFamily: FONT }}>
          {number}
        </div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function InstallGuide() {
  const [active, setActive] = useState('before-you-start');

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-15% 0px -70% 0px' }
    );
    SECTIONS.forEach(({ id }) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8faf8', fontFamily: FONT }}>
      <style>{`
        @media (max-width: 768px) {
          .ig-layout { flex-direction: column !important; }
          .ig-sidebar { width: 100% !important; position: static !important; max-height: none !important; display: flex !important; flex-wrap: wrap !important; gap: 4px !important; }
          .ig-sidebar button { flex: 0 0 auto !important; width: auto !important; border-radius: 20px !important; border-left: none !important; padding: 6px 14px !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #ebebeb', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', gap: '14px', position: 'sticky', top: 0, zIndex: 20 }}>
        <img
          src="https://quickquote360.com/wp-content/uploads/2023/09/Quick-Quote-360-logos-5-300x300.png"
          alt="QuickQuote360"
          style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#111827', lineHeight: 1 }}>Quick Quote</span>
          <span style={{ fontSize: '10px', fontWeight: '700', color: LIME, letterSpacing: '0.15em' }}>360</span>
        </div>
        <div style={{ width: '1px', height: '28px', backgroundColor: '#e5e7eb', margin: '0 6px' }} />
        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0d1117' }}>Installation Guide</h1>
        <div style={{ flex: 1 }} />
        <a href="/client/settings?tab=embed" style={{ fontSize: '13px', color: PRIMARY, fontWeight: '600', textDecoration: 'none', backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '6px 14px' }}>
          ← Back to Dashboard
        </a>
      </header>

      <div className="ig-layout" style={{ display: 'flex', maxWidth: '1160px', margin: '0 auto', padding: '32px 24px', gap: '28px', alignItems: 'flex-start' }}>

        {/* Sidebar */}
        <nav className="ig-sidebar" style={{ width: '210px', flexShrink: 0, position: 'sticky', top: '80px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '14px', maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 10px', padding: '0 6px', fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contents</p>
          {SECTIONS.map(({ id, label }) => {
            const on = active === id;
            return (
              <button key={id} type="button" onClick={() => scrollTo(id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: on ? '8px 10px' : '8px 13px', marginBottom: '2px', fontSize: '12.5px', fontWeight: on ? '700' : '400', color: on ? PRIMARY : '#6b7280', backgroundColor: on ? '#f0fdf4' : 'transparent', border: 'none', borderLeft: on ? `3px solid ${PRIMARY}` : '3px solid transparent', borderRadius: on ? '0 8px 8px 0' : '8px', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.12s', lineHeight: 1.4 }}>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* ─── 1. Before You Start ─── */}
          <SectionCard id="before-you-start" number="1" title="Before You Start">
            <H3>What you need</H3>
            <BulletList items={[
              'Your embed code from the dashboard (Settings → Embed Code)',
              'Access to your website\'s backend or CMS editor',
              '10–15 minutes',
            ]} />

            <H3>Two installation methods</H3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '10px' }}>
              <div style={{ border: `2px solid ${PRIMARY}`, borderRadius: '12px', padding: '16px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '700', color: PRIMARY, fontFamily: FONT }}>Script Tag — Recommended</p>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#374151', fontFamily: FONT, lineHeight: '1.6' }}>Gives the best experience. Auto-resizes to fit content. Loads as part of your page. Works on all modern platforms.</p>
              </div>
              <div style={{ border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '700', color: '#374151', fontFamily: FONT }}>iFrame</p>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#374151', fontFamily: FONT, lineHeight: '1.6' }}>Simpler. Works everywhere. Fixed height — you must set it manually. Good fallback for platforms that restrict scripts.</p>
              </div>
            </div>

            <Warn>⚠ The widget requires JavaScript to be enabled in the visitor's browser.</Warn>
            <Tip>🔒 Your unique client ID is already embedded in the code — do not share it publicly, as it identifies your account.</Tip>
          </SectionCard>

          {/* ─── 2. WordPress ─── */}
          <SectionCard id="wordpress" number="2" title="WordPress">
            <H3>Block Editor (Gutenberg)</H3>
            <StepList steps={[
              'Log in to your WordPress admin dashboard.',
              'Go to the page where you want the estimator (Pages → Edit).',
              'In the block editor, click the + button to add a new block.',
              'Search for "Custom HTML" and click it.',
              'Paste your Script Tag code into the HTML block.',
              'Click Preview to test, then click Update to save.',
              'Visit your page — the estimator should appear.',
            ]} />

            <H3>Classic Editor</H3>
            <StepList steps={[
              'Click the "Text" tab (not Visual) in the editor.',
              'Paste the Script Tag code where you want it to appear.',
              'Click Preview, then Update.',
            ]} />
            <Warn>Always use the "Text" tab when pasting embed code. The "Visual" tab will strip or corrupt script tags.</Warn>

            <H3>Elementor</H3>
            <StepList steps={[
              'Edit the page with Elementor.',
              'Search for the "HTML" widget in the left panel.',
              'Drag it to where you want the estimator.',
              'Paste the Script Tag code into the HTML field.',
              'Click Update.',
            ]} />

            <H3>Divi</H3>
            <StepList steps={[
              'Enable the Divi Builder on your page.',
              'Add a new row, then add a "Code" module.',
              'Paste the Script Tag code.',
              'Save.',
            ]} />

            <H3>Troubleshooting WordPress</H3>
            <BulletList items={[
              'Widget not appearing: make sure you used the "Text" tab, not "Visual", when pasting.',
              'Widget cut off: the estimator needs at least 600px of content width — check your theme settings.',
              'Script blocked: some security plugins (Wordfence, etc.) may block external scripts — whitelist estimator.quickquote360.com.',
              'Caching: if you made changes and don\'t see them, clear your cache (WP Rocket, W3 Total Cache, etc.).',
            ]} />
          </SectionCard>

          {/* ─── 3. Webflow ─── */}
          <SectionCard id="webflow" number="3" title="Webflow">
            <H3>Adding to a specific page</H3>
            <StepList steps={[
              'Open your Webflow project in the Designer.',
              'Navigate to the page where you want the estimator.',
              'In the left panel, click the + (Add Elements) icon.',
              'Search for "Embed" or find it under Components.',
              'Drag the Embed element to where you want the estimator on your page.',
              'Double-click the Embed element to open the code editor.',
              'Paste your Script Tag code.',
              'Click Save & Close.',
              'Click Publish to make it live.',
            ]} />

            <H3>Site-wide installation (floating bubble only)</H3>
            <StepList steps={[
              'Go to Project Settings → Custom Code.',
              'Paste the Script Tag in the "Footer Code" section (before </body>).',
              'Save and Publish.',
            ]} />

            <Warn>⚠ You need a paid Webflow plan to use custom code embeds.</Warn>
            <Tip>The embed element will not show in the Designer preview — this is normal. Click Preview to see it.</Tip>
            <Tip>If the widget appears cut off, add min-height: 700px to the embed element's styles.</Tip>

            <H3>Troubleshooting Webflow</H3>
            <BulletList items={[
              '"Custom code not allowed": you need a paid Webflow Site plan.',
              'Widget invisible in Designer: normal — only visible in Preview and on the published site.',
              'Height issues: set a min-height on the Embed element.',
            ]} />
          </SectionCard>

          {/* ─── 4. Squarespace ─── */}
          <SectionCard id="squarespace" number="4" title="Squarespace">
            <H3>Adding to a specific page</H3>
            <StepList steps={[
              'Open your Squarespace page editor.',
              'Click the area where you want to add the estimator.',
              'Click the + button to add a block.',
              'Select "Code" from the block options.',
              'Paste your Script Tag code into the code block.',
              'Click Apply.',
              'Click Save on the page.',
            ]} />

            <H3>Site-wide installation</H3>
            <StepList steps={[
              'Go to Settings → Advanced → Code Injection.',
              'Paste the Script Tag in the Footer section.',
              'Save.',
            ]} />

            <Warn>⚠ Adding custom JavaScript requires a Business plan or higher on Squarespace. If you are on a Personal plan, use the iFrame embed code instead — it works on all plans.</Warn>
            <Tip>The code block may show as a grey box in the editor — this is normal. Preview the page to see the widget.</Tip>

            <H3>Troubleshooting Squarespace</H3>
            <BulletList items={[
              '"This feature is not available on your plan": upgrade to Business plan, or use the iFrame method instead.',
              'Widget not visible in editor: normal — preview the published page.',
              'Script stripped: Squarespace sometimes strips script tags on lower plans — use the iFrame code instead.',
            ]} />
          </SectionCard>

          {/* ─── 5. Wix ─── */}
          <SectionCard id="wix" number="5" title="Wix">
            <StepList steps={[
              'Open your Wix Editor.',
              'Click the + button to add an element.',
              'Go to Embed → Embed a Website (or "Custom Embeds" → "Embed HTML").',
              'A grey box will appear — click "Enter Code".',
              'Paste your Script Tag code (or iFrame code — iFrame is more reliable on Wix).',
              'Click Apply.',
              'Resize the element to at least 700px tall.',
              'Publish your site.',
            ]} />

            <Warn>⚠ Wix does NOT support auto-resizing for embeds. You must manually set the embed height to at least 700px to show the full estimator.</Warn>
            <Tip>iFrame embed is more reliable than Script Tag on Wix. Copy the iFrame code from Settings → Embed Code if the Script Tag doesn't work.</Tip>

            <H3>Troubleshooting Wix</H3>
            <BulletList items={[
              'Widget cut off: increase the embed height manually — Wix does not auto-resize.',
              'Script not working: switch to the iFrame embed code.',
              'Not visible: make sure you clicked Apply after pasting the code.',
            ]} />
          </SectionCard>

          {/* ─── 6. Custom HTML ─── */}
          <SectionCard id="custom-html" number="6" title="Custom HTML / Static Sites">
            <H3>Before the closing &lt;/body&gt; tag</H3>
            <StepList steps={[
              'Open your HTML file in a code editor.',
              'Find the closing </body> tag.',
              'Paste your Script Tag code just before </body>.',
              'Save and upload the file to your server.',
            ]} />

            <H3>Inline placement on a specific page</H3>
            <StepList steps={[
              'Find where you want the estimator in your HTML.',
              'Paste the Script Tag code at that exact location.',
              'The estimator will appear inline where you placed it.',
            ]} />

            <H3>Example</H3>
            <CodeBlock>{`<main>
  <h1>Get a Free Estimate</h1>

  <!-- Paste your Script Tag here -->
  <script
    src="https://estimator.quickquote360.com/embed.js"
    data-client-id="YOUR_CLIENT_ID">
  </script>
</main>`}</CodeBlock>
          </SectionCard>

          {/* ─── 7. React / Next.js / Vue ─── */}
          <SectionCard id="react-nextjs-vue" number="7" title="React / Next.js / Vue">
            <H3>React — component approach</H3>
            <CodeBlock>{`function QuickQuoteEstimator() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://estimator.quickquote360.com/embed.js';
    script.setAttribute('data-client-id', 'YOUR_CLIENT_ID');
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  return <div id="quickquote-estimator" />;
}`}</CodeBlock>

            <H3>Next.js — using next/script</H3>
            <CodeBlock>{`import Script from 'next/script';

<Script
  src="https://estimator.quickquote360.com/embed.js"
  data-client-id="YOUR_CLIENT_ID"
  strategy="lazyOnload"
/>`}</CodeBlock>

            <H3>Vue — mounted lifecycle hook</H3>
            <CodeBlock>{`mounted() {
  const script = document.createElement('script');
  script.src = 'https://estimator.quickquote360.com/embed.js';
  script.setAttribute('data-client-id', 'YOUR_CLIENT_ID');
  document.body.appendChild(script);
}`}</CodeBlock>
          </SectionCard>

          {/* ─── 8. Troubleshooting ─── */}
          <SectionCard id="troubleshooting" number="8" title="Troubleshooting">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {[
                {
                  q: 'Widget not appearing at all',
                  a: 'Check the browser console for errors (F12 → Console). Make sure JavaScript is not blocked by the browser or a security plugin.',
                },
                {
                  q: 'White blank space where the widget should be',
                  a: 'The widget may still be loading — wait a few seconds or check your internet connection. Also check the browser console for errors.',
                },
                {
                  q: 'Widget appears but no content',
                  a: 'Your client ID may be wrong — copy it fresh from Settings → Embed Code in your dashboard.',
                },
                {
                  q: 'Estimator broken after a website update',
                  a: 'Re-paste the embed code fresh from the dashboard. Website updates can sometimes overwrite or reset custom code sections.',
                },
                {
                  q: 'Mobile display issues',
                  a: 'The widget is responsive but needs at least 320px of available width. Check your page\'s mobile layout.',
                },
                {
                  q: 'CSP errors in the browser console',
                  a: 'Your website has a Content Security Policy blocking external scripts. Whitelist estimator.quickquote360.com and estimator-widget-production.up.railway.app in your CSP header.',
                },
                {
                  q: 'Nothing works',
                  a: 'Use the "Report a Bug" feature in your dashboard sidebar with a screenshot of the browser console errors (F12 → Console). We will help you directly.',
                },
              ].map(({ q, a }) => (
                <div key={q} style={{ border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '13.5px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>❓ {q}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151', fontFamily: FONT, lineHeight: '1.6' }}>{a}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ─── 9. Verifying ─── */}
          <SectionCard id="verifying" number="9" title="Verifying the Installation">
            <p style={{ margin: '0 0 4px', fontSize: '13.5px', color: '#374151', fontFamily: FONT, lineHeight: '1.6' }}>
              Follow these steps to confirm everything is working correctly:
            </p>
            <StepList steps={[
              'After installing, go to your website page as a visitor (not logged in to your website builder).',
              'You should see the QuickQuote360 chat bubble in the bottom right corner of the page.',
              'Click the bubble — the estimator should open.',
              'Complete a test estimate — you should see a new lead appear in your dashboard within seconds.',
              'If the lead appears in your dashboard, the installation is complete and working! 🎉',
            ]} />
            <Tip>✅ If you see the lead appear in your dashboard, you are all set. Your estimator is live and capturing leads.</Tip>

            <div style={{ marginTop: '28px', backgroundColor: '#0d1f12', borderRadius: '14px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#ffffff', fontFamily: FONT }}>Installation complete?</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontFamily: FONT }}>Head back to your dashboard to start managing leads.</p>
              </div>
              <a href="/client"
                style={{ backgroundColor: LIME, color: '#0d1f12', borderRadius: '10px', padding: '10px 24px', fontSize: '13.5px', fontWeight: '700', textDecoration: 'none', fontFamily: FONT, display: 'inline-block', whiteSpace: 'nowrap' }}>
                Go to Dashboard →
              </a>
            </div>
          </SectionCard>

        </main>
      </div>
    </div>
  );
}
