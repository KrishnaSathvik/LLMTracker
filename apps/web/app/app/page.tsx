'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Dashboard() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventType: 'all',
    provider: 'all',
    showOnlyLLM: false,
    showOnlyCorrelated: false
  });

  useEffect(() => {
    // Check authentication
    if (typeof window === 'undefined') return;
    
    const apiKey = localStorage.getItem('afr_api_key');
    if (!apiKey) {
      window.location.href = '/auth';
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('LLM Tracker: Fetching runs from', `${API}/runs`);
    }
    fetch(`${API}/runs`, {
      headers: {
        'X-AFR-Key': apiKey
      }
    })
      .then(r => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('LLM Tracker: Response status', r.status);
        }
        return r.json();
      })
      .then(data => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('LLM Tracker: Received runs data', data);
        }
        setRuns(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('LLM Tracker: Error fetching runs', err);
        setRuns([]);
      });
  }, []);

  const openRun = async (id: string) => {
    setLoading(true);
    setSelected(null);
    try {
      if (typeof window === 'undefined') return;
      const apiKey = localStorage.getItem('afr_api_key');
      const headers = { 'X-AFR-Key': apiKey || '' };
      const [run, evs] = await Promise.all([
        fetch(`${API}/runs/${id}`, { headers }).then(r => r.json()),
        fetch(`${API}/runs/${id}/events`, { headers }).then(r => r.json())
      ]);
      setSelected(run);
      setEvents(evs);
      applyFilters(evs);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (evs: any[]) => {
    let filtered = [...evs];

    if (filters.eventType !== 'all') {
      filtered = filtered.filter(e => e.kind === filters.eventType);
    }

    if (filters.provider !== 'all') {
      filtered = filtered.filter(e => e.payload?.provider === filters.provider);
    }

    if (filters.showOnlyLLM) {
      filtered = filtered.filter(e => e.payload?.llm === true);
    }

    if (filters.showOnlyCorrelated) {
      filtered = filtered.filter(e => e.payload?.correlationId || e.payload?.correlationServer);
    }

    setFilteredEvents(filtered);
  };

  useEffect(() => {
    if (events.length > 0) {
      applyFilters(events);
    }
  }, [filters, events]);

  const getUniqueProviders = () => {
    const providers = new Set<string>();
    events.forEach(e => {
      if (e.payload?.provider) {
        providers.add(e.payload.provider);
      }
    });
    return Array.from(providers).sort();
  };

  const exportRun = () => {
    if (!selected || !filteredEvents.length) return;
    
    const exportData = {
      run: selected,
      events: filteredEvents,
      exportInfo: {
        timestamp: new Date().toISOString(),
        totalEvents: events.length,
        filteredEvents: filteredEvents.length,
        filters: filters
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afr-run-${selected.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const workspaceName = typeof window !== 'undefined' ? localStorage.getItem('afr_workspace_name') || 'Your Workspace' : 'Your Workspace';

  return (
    <div className="row">
      <div style={{ width: 320 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Runs</h3>
            <a href="/app/analytics" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9em' }}>
              📊 Analytics
            </a>
          </div>
          <small style={{ color: '#666' }}>Workspace: {workspaceName}</small>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {runs.length === 0 && <li><small>No runs found (count: {runs.length})</small></li>}
            {runs.map(r => (
              <li key={r.id} style={{ marginBottom: 8 }}>
                <a href="#" onClick={() => openRun(r.id)} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div><strong>{r.id.slice(0,8)}</strong></div>
                  <small className="muted">{new Date(r.created_at).toLocaleString()}</small>
                </a>
                <div style={{ marginTop: '4px' }}>
                  <a href={`/app/run/${r.id}`} style={{ fontSize: '0.8em', color: '#2563eb', textDecoration: 'none' }}>
                    🔍 Detailed View
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              Timeline {selected ? <small className="muted">— {selected.url || 'N/A'}</small> : null}
            </h3>
            {selected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  {filteredEvents.length} / {events.length} events
                </div>
                <button 
                  onClick={exportRun}
                  style={{ 
                    padding: '6px 12px', 
                    background: '#2563eb', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    fontSize: '0.9em',
                    cursor: 'pointer'
                  }}
                >
                  📥 Export
                </button>
              </div>
            )}
          </div>
          
          {selected && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '4px', fontWeight: '500' }}>
                    Event Type:
                  </label>
                  <select 
                    value={filters.eventType}
                    onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  >
                    <option value="all">All Events</option>
                    <option value="network">Network</option>
                    <option value="click">Clicks</option>
                    <option value="dom_fp">DOM Fingerprints</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '4px', fontWeight: '500' }}>
                    Provider:
                  </label>
                  <select 
                    value={filters.provider}
                    onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  >
                    <option value="all">All Providers</option>
                    {getUniqueProviders().map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9em', fontWeight: '500' }}>Filters:</label>
                  <label style={{ fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="checkbox"
                      checked={filters.showOnlyLLM}
                      onChange={(e) => setFilters(prev => ({ ...prev, showOnlyLLM: e.target.checked }))}
                    />
                    LLM Calls Only
                  </label>
                  <label style={{ fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="checkbox"
                      checked={filters.showOnlyCorrelated}
                      onChange={(e) => setFilters(prev => ({ ...prev, showOnlyCorrelated: e.target.checked }))}
                    />
                    Correlated Only
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {loading && <p>Loading…</p>}
          {!loading && !selected && <p>Select a run from the left.</p>}
          {!loading && selected && (
            <div className="timeline">
              {filteredEvents.map(ev => (
                <div key={ev.id} className="event" style={{
                  borderLeft: ev.payload?.correlationId || ev.payload?.correlationServer ? '4px solid #059669' : '4px solid #e5e7eb',
                  paddingLeft: '12px',
                  marginBottom: '12px'
                }}>
                  <div className="kind">
                    {ev.kind} 
                    {ev.payload?.provider && <span style={{ color: '#2563eb', marginLeft: '8px' }}>• {ev.payload.provider}</span>}
                    {ev.payload?.llm && <span style={{ color: '#dc2626', marginLeft: '8px' }}>🤖</span>}
                    {ev.payload?.correlationId && <span style={{ color: '#059669', marginLeft: '8px' }}>🔗 Client Corr</span>}
                    {ev.payload?.correlationServer && <span style={{ color: '#059669', marginLeft: '8px' }}>🔗 Server Corr</span>}
                    <small className="muted">t={ev.t_ms}</small>
                  </div>
                  
                  {/* Enhanced display for different event types */}
                  {ev.kind === 'click' && (
                    <div style={{ marginBottom: '8px', padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                      <strong>Click:</strong> {ev.payload?.text || 'No text'} 
                      {ev.payload?.selector && <span style={{ color: '#666' }}> on {ev.payload.selector}</span>}
                      {ev.payload?.correlationId && <div style={{ fontSize: '0.9em', color: '#059669' }}>→ Correlated to LLM call: {ev.payload.correlationId}</div>}
                      {ev.payload?.correlationServer && <div style={{ fontSize: '0.9em', color: '#059669' }}>→ Server correlated: {ev.payload.correlationServer.llmEventId} (Δt: {ev.payload.correlationServer.dt}ms)</div>}
                    </div>
                  )}
                  
                  {ev.kind === 'network' && ev.payload?.llm && (
                    <div style={{ marginBottom: '8px', padding: '8px', background: '#fef2f2', borderRadius: '4px' }}>
                      <strong>🤖 LLM Call:</strong> {ev.payload.provider || 'Unknown'} 
                      {ev.payload?.res?.status && <span style={{ marginLeft: '8px', color: ev.payload.res.status < 400 ? '#059669' : '#dc2626' }}>({ev.payload.res.status})</span>}
                      {ev.payload?.durMs && <span style={{ marginLeft: '8px' }}>({ev.payload.durMs}ms)</span>}
                      {ev.payload?.corrId && <div style={{ fontSize: '0.9em', color: '#059669' }}>Correlation ID: {ev.payload.corrId}</div>}
                    </div>
                  )}
                  
                  {ev.kind === 'dom_fp' && (
                    <div style={{ marginBottom: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '4px' }}>
                      <strong>DOM Fingerprint:</strong> {ev.payload?.actionables?.length || 0} actionable elements
                      {ev.payload?.layoutHash && <span style={{ color: '#666' }}> (hash: {ev.payload.layoutHash.slice(0, 8)}...)</span>}
                    </div>
                  )}
                  
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8em', color: '#666' }}>{JSON.stringify(ev.payload, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}