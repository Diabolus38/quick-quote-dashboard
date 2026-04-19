import Layout from '../Layout';

export default function Settings() {
  return (
    <Layout title="Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <ProfileCard />
        <PricingCard />
        <DangerCard />
      </div>
    </Layout>
  );
}

function ProfileCard() {
  return (
    <Card>
      <CardTitle>Profile</CardTitle>
      <div style={fieldGrid}>
        <Field label="Full Name"     defaultValue="Admin User" />
        <Field label="Email"         defaultValue="admin@quickquote360.com" />
      </div>
      <CardFooter />
    </Card>
  );
}

function PricingCard() {
  return (
    <Card>
      <CardTitle>Pricing Defaults</CardTitle>
      <div style={fieldGrid}>
        <Field label="Fixed Monthly Fee" defaultValue="990 kr" />
        <Field label="Fee Per Estimate"  defaultValue="12 kr"  />
      </div>
      <CardFooter />
    </Card>
  );
}

function DangerCard() {
  return (
    <Card>
      <CardTitle color="#dc2626">Danger Zone</CardTitle>
      <p style={{
        margin: '0 0 20px',
        fontSize: '13px',
        color: '#64748b',
      }}>
        These actions are irreversible. Be careful.
      </p>
      <button type="button" style={{
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: 'none',
        borderRadius: '7px',
        padding: '9px 20px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
      }}>
        Reset All Data
      </button>
    </Card>
  );
}

function Card({ children }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children, color = '#0f172a' }) {
  return (
    <p style={{
      margin: '0 0 20px',
      fontSize: '15px',
      fontWeight: '600',
      color,
    }}>
      {children}
    </p>
  );
}

function Field({ label, defaultValue }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '500',
        color: '#64748b',
        marginBottom: '6px',
        letterSpacing: '0.2px',
      }}>
        {label}
      </label>
      <input
        type="text"
        defaultValue={defaultValue}
        style={{
          width: '100%',
          padding: '9px 12px',
          fontSize: '14px',
          color: '#0f172a',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '7px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function CardFooter() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: '1px solid #f1f5f9',
    }}>
      <button type="button" style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        border: 'none',
        borderRadius: '7px',
        padding: '9px 20px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
      }}>
        Save
      </button>
    </div>
  );
}

const fieldGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px',
};
