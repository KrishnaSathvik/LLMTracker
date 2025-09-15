'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AnalyticsData {
  overview?: {
    totals: {
      runs: number;
      events: number;
      llmCalls: number;
      clicks: number;
      domFingerprints: number;
    };
    recentRuns: Array<{ created_at: string; url: string }>;
  };
  providers?: Array<{
    provider: string;
    count: number;
    avg_duration: number;
    success_count: number;
    error_count: number;
  }>;
  performance?: Array<{
    hour: string;
    events: number;
    avg_duration: number;
    llm_calls: number;
    clicks: number;
  }>;
  correlations?: {
    total_clicks: number;
    correlated_clicks: number;
    server_correlated_clicks: number;
  };
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [overview, providers, performance, correlations] = await Promise.all([
          fetch(`${API}/analytics/overview`).then(r => r.json()),
          fetch(`${API}/analytics/providers`).then(r => r.json()),
          fetch(`${API}/analytics/performance`).then(r => r.json()),
          fetch(`${API}/analytics/correlations`).then(r => r.json())
        ]);
        
        setData({ overview, providers, performance, correlations });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div className="container"><p>Loading analytics...</p></div>;
  if (error) return <div className="container"><p>Error: {error}</p></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Analytics Dashboard</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/reports" style={{ color: '#2563eb', textDecoration: 'none' }}>📋 Reports</Link>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>← Back to Runs</Link>
        </div>
      </div>

      {/* Overview Cards */}
      {data.overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="card">
            <h3>Total Runs</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#2563eb' }}>
              {data.overview?.totals?.runs || 0}
            </div>
          </div>
          <div className="card">
            <h3>Total Events</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#059669' }}>
              {(data.overview?.totals?.events || 0).toLocaleString()}
            </div>
          </div>
          <div className="card">
            <h3>LLM Calls</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#dc2626' }}>
              {(data.overview?.totals?.llmCalls || 0).toLocaleString()}
            </div>
          </div>
          <div className="card">
            <h3>User Clicks</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#7c3aed' }}>
              {(data.overview?.totals?.clicks || 0).toLocaleString()}
            </div>
          </div>
          <div className="card">
            <h3>DOM Fingerprints</h3>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ea580c' }}>
              {(data.overview?.totals?.domFingerprints || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Provider Statistics */}
        {data.providers && data.providers.length > 0 && (
          <div className="card">
            <h3>LLM Provider Usage</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Provider</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Calls</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Avg Duration</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.providers?.map((provider) => (
                    <tr key={provider.provider} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px', fontWeight: '500' }}>{provider.provider}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>{provider.count}</td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>
                        {provider.avg_duration ? `${Math.round(provider.avg_duration)}ms` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px' }}>
                        {Math.round((provider.success_count / provider.count) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Correlation Statistics */}
        {data.correlations && (
          <div className="card">
            <h3>Click Correlation Analysis</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Total Clicks:</span>
                <strong>{data.correlations?.total_clicks || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Client Correlated:</span>
                <strong>{data.correlations?.correlated_clicks || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Server Correlated:</span>
                <strong>{data.correlations?.server_correlated_clicks || 0}</strong>
              </div>
            </div>
            <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                Correlation Rate: {Math.round(((data.correlations?.correlated_clicks || 0) / Math.max(data.correlations?.total_clicks || 1, 1)) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Chart */}
      {data.performance && data.performance.length > 0 && (
        <div className="card">
          <h3>24-Hour Performance Trend</h3>
          <div style={{ height: '300px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Hour</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Events</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>LLM Calls</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Clicks</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {data.performance?.slice(0, 12)?.map((hour) => (
                  <tr key={hour.hour} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>
                      {new Date(hour.hour).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{hour.events}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{hour.llm_calls}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{hour.clicks}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>
                      {hour.avg_duration ? `${Math.round(hour.avg_duration)}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Runs */}
      {data.overview?.recentRuns && data.overview.recentRuns.length > 0 && (
        <div className="card">
          <h3>Recent Activity</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {data.overview?.recentRuns?.map((run, index) => (
              <div key={index} style={{ 
                padding: '12px', 
                borderBottom: index < (data.overview?.recentRuns?.length || 0) - 1 ? '1px solid #f3f4f6' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {run.url || 'Unknown URL'}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {new Date(run.created_at).toLocaleString()}
                  </div>
                </div>
                <Link href={`/`} style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.9em' }}>
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
