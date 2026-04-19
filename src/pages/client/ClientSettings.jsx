import ClientLayout from '../../ClientLayout';

export default function ClientSettings() {
  return (
    <ClientLayout title="Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <CompanyProfileCard />
        <EstimatorSettingsCard />
      </div>
    </ClientLayout>
  );
}

function CompanyProfileCard() {
  return (
    <Card>
      <CardTitle>Company Profile</CardTitle>
      <div style={fieldGrid}>
        <Field label="Company Name"   defaultValue="Acme AB"              />
        <Field label="Contact Email"  defaultValue="contact@acmeab.com"   />
        <Field label="Phone"          defaultValue="+46 70 123 45 67"     />
      </div>
      <CardFooter />
    </Card>
  );
}

function EstimatorSettingsCard() {
  return (
    <Card>
      <CardTitle>Estimator Display Settings</CardTitle>
      <div style={fieldGrid}>
        <Field label="Widget Title"   defaultValue="Get an instant estimate" />
        <Field
          label="Primary Color"
          defaultValue="#60a5fa"
          helperText="This controls the button and accent color in your estimator widget"
        />
      </div>
      <CardFooter />
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

function CardTitle({ children }) {
  return (
    <p style={{
      margin: '0 0 20px',
      fontSize: '15px',
      fontWeight: '600',
      color: '#0f172a',
    }}>
      {children}
    </p>
  );
}

function Field({ label, defaultValue, helperText }) {
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
      {helperText && (
        <p style={{
          margin: '6px 0 0',
          fontSize: '12px',
          color: '#94a3b8',
          lineHeight: '1.5',
        }}>
          {helperText}
        </p>
      )}
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
