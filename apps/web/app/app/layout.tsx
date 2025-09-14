export const metadata = { title: 'LLM Tracker Dashboard' };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial' }}>
      <div style={{ maxWidth: 1000, margin: '24px auto', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 8, margin: 0 }}>LLM Tracker</h1>
            <p style={{ color: '#666', margin: 0 }}>Dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="/" style={{ color: '#666', textDecoration: 'none' }}>← Back to Home</a>
            <button 
              onClick={() => {
                localStorage.removeItem('afr_api_key');
                localStorage.removeItem('afr_workspace_id');
                localStorage.removeItem('afr_workspace_name');
                window.location.href = '/';
              }}
              style={{ 
                padding: '8px 16px', 
                background: '#dc2626', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
