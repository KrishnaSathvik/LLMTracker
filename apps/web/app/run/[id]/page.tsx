'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DiffPanel from '../../../components/DiffPanel';
import ReplayPlayer from '../../../components/ReplayPlayer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Keyframe {
  id: string;
  t_ms: number;
  kind: string;
  blob_url: string;
  data: any;
}

interface Event {
  id: string;
  t_ms: number;
  kind: string;
  payload: any;
}

export default function RunPage() {
  const params = useParams();
  const runId = params.id as string;
  
  const [run, setRun] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [selectedTime, setSelectedTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diffData, setDiffData] = useState<any>(null);
  const [showDiff, setShowDiff] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'X-AFR-Key': process.env.NEXT_PUBLIC_API_KEY || '' };
        const [runData, eventsData, keyframesData] = await Promise.all([
          fetch(`${API}/runs/${runId}`, { headers }).then(r => r.json()),
          fetch(`${API}/runs/${runId}/events`, { headers }).then(r => r.json()),
          fetch(`${API}/runs/${runId}/keyframes`, { headers }).then(r => r.json())
        ]);
        
        setRun(runData);
        setEvents(eventsData);
        setKeyframes(keyframesData);
        
        if (eventsData.length > 0) {
          setSelectedTime(eventsData[0].t_ms);
        }
      } catch (error) {
        console.error('Failed to fetch run data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [runId]);
  
  const fetchDiff = async (againstRunId: string) => {
    try {
      const response = await fetch(`${API}/runs/${runId}/diff?against=${againstRunId}`, {
        headers: { 'X-AFR-Key': process.env.NEXT_PUBLIC_API_KEY || '' }
      });
      const data = await response.json();
      setDiffData(data);
      setShowDiff(true);
    } catch (error) {
      console.error('Failed to fetch diff:', error);
    }
  };
  
  const getCurrentKeyframe = () => {
    return keyframes.reduce((prev, curr) => {
      return Math.abs(curr.t_ms - selectedTime) < Math.abs(prev.t_ms - selectedTime) ? curr : prev;
    }, keyframes[0]);
  };
  
  const getEventsAtTime = (time: number) => {
    const window = 5000; // 5 second window
    return events.filter(e => Math.abs(e.t_ms - time) <= window);
  };
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  const getDuration = () => {
    if (events.length === 0) return 0;
    return events[events.length - 1].t_ms - events[0].t_ms;
  };
  
  if (loading) return <div className="container"><p>Loading run...</p></div>;
  if (!run) return <div className="container"><p>Run not found</p></div>;
  
  const currentKeyframe = getCurrentKeyframe();
  const eventsAtTime = getEventsAtTime(selectedTime);
  const duration = getDuration();
  
  return (
    <div className="container">
      <div style={{ marginBottom: '24px' }}>
        <h1>Run {runId.slice(0, 8)}</h1>
        <div style={{ color: '#666', marginBottom: '16px' }}>
          <strong>URL:</strong> {run.url || 'N/A'}<br/>
          <strong>Duration:</strong> {formatTime(duration)}<br/>
          <strong>Events:</strong> {events.length} | <strong>Keyframes:</strong> {keyframes.length}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: showDiff ? '1fr 1fr' : '1fr 300px', gap: '24px' }}>
        {/* Main Replay Area */}
        <div className="card">
          <h3>Visual Replay</h3>
          
          {/* Timeline Scrubber */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  padding: '8px 12px',
                  background: isPlaying ? '#dc2626' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
              <span style={{ fontSize: '0.9em', color: '#666' }}>
                {formatTime(selectedTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <input
              type="range"
              min={events[0]?.t_ms || 0}
              max={events[events.length - 1]?.t_ms || 0}
              value={selectedTime}
              onChange={(e) => setSelectedTime(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          {/* Keyframe Display */}
          {currentKeyframe && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
              <h4>Snapshot at {formatTime(currentKeyframe.t_ms)}</h4>
              <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '12px' }}>
                Type: {currentKeyframe.kind} | URL: {currentKeyframe.data?.url || 'N/A'}
              </div>
              
              {currentKeyframe.data?.domSnapshot && (
                <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '4px' }}>
                  <h5>DOM Summary</h5>
                  <div style={{ fontSize: '0.9em' }}>
                    <div><strong>Elements:</strong> {currentKeyframe.data.domSnapshot.elementCount}</div>
                    <div><strong>Links:</strong> {currentKeyframe.data.domSnapshot.links?.length || 0}</div>
                    <div><strong>Buttons:</strong> {currentKeyframe.data.domSnapshot.buttons?.length || 0}</div>
                  </div>
                  
                  {currentKeyframe.data.domSnapshot.buttons?.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Buttons:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {currentKeyframe.data.domSnapshot.buttons.map((btn: any, i: number) => (
                          <li key={i} style={{ fontSize: '0.8em' }}>
                            "{btn.text}" {btn.disabled ? '(disabled)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {currentKeyframe.data.domSnapshot.links?.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Links:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {currentKeyframe.data.domSnapshot.links.map((link: any, i: number) => (
                          <li key={i} style={{ fontSize: '0.8em' }}>
                            "{link.text}" → {link.href}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Events at Current Time */}
          {eventsAtTime.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4>Events at {formatTime(selectedTime)} (±5s)</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {eventsAtTime.map(event => (
                  <div key={event.id} style={{ 
                    padding: '8px', 
                    marginBottom: '8px', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '4px',
                    borderLeft: event.payload?.correlationId || event.payload?.correlationServer ? '4px solid #059669' : '4px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '0.9em', fontWeight: '500' }}>
                      {event.kind} 
                      {event.payload?.provider && <span style={{ color: '#2563eb' }}> • {event.payload.provider}</span>}
                      {event.payload?.llm && <span style={{ color: '#dc2626' }}> 🤖</span>}
                      <span style={{ color: '#666', marginLeft: '8px' }}>t={event.t_ms}</span>
                    </div>
                    
                    {event.kind === 'click' && (
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        Clicked: "{event.payload?.text}" on {event.payload?.selector}
                      </div>
                    )}
                    
                    {event.kind === 'network' && event.payload?.llm && (
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        LLM Call: {event.payload.provider} ({event.payload.res?.status}) - {event.payload.durMs}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Diff Panel */}
        {showDiff && diffData && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Run Diff Analysis</h3>
              <button 
                onClick={() => setShowDiff(false)}
                style={{ background: '#dc2626', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            {diffData.probable_cause && diffData.probable_cause.length > 0 && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <h4 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>Probable Causes</h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {diffData.probable_cause.map((cause: string, i: number) => (
                    <li key={i} style={{ color: '#991b1b' }}>{cause}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {diffData.changed && diffData.changed.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#d97706' }}>Changed Elements ({diffData.changed.length})</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {diffData.changed.map((change: any, i: number) => (
                    <div key={i} style={{ padding: '8px', marginBottom: '8px', background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.9em', fontWeight: '500' }}>{change.selector}</div>
                      <div style={{ fontSize: '0.8em', color: '#92400e' }}>
                        <div>Before: "{change.before}"</div>
                        <div>After: "{change.after}"</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {diffData.removed && diffData.removed.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#dc2626' }}>Removed Elements ({diffData.removed.length})</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {diffData.removed.map((removed: any, i: number) => (
                    <div key={i} style={{ padding: '8px', marginBottom: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.9em', fontWeight: '500' }}>{removed.selector}</div>
                      <div style={{ fontSize: '0.8em', color: '#991b1b' }}>"{removed.text}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {diffData.disabled && diffData.disabled.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#dc2626' }}>Disabled Elements ({diffData.disabled.length})</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {diffData.disabled.map((disabled: any, i: number) => (
                    <div key={i} style={{ padding: '8px', marginBottom: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.9em', fontWeight: '500' }}>{disabled.selector}</div>
                      <div style={{ fontSize: '0.8em', color: '#991b1b' }}>"{disabled.text}" (disabled)</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {diffData.layout_hash_changed && (
              <div style={{ padding: '8px', background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.9em', color: '#1e40af' }}>
                  ⚠️ Layout structure changed significantly
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Sidebar */}
        <div>
          <div className="card">
            <h4>Keyframes</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {keyframes.map(keyframe => (
                <div 
                  key={keyframe.id} 
                  onClick={() => setSelectedTime(keyframe.t_ms)}
                  style={{
                    padding: '8px',
                    marginBottom: '4px',
                    background: Math.abs(keyframe.t_ms - selectedTime) < 1000 ? '#e0f2fe' : '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em'
                  }}
                >
                  <div style={{ fontWeight: '500' }}>
                    {formatTime(keyframe.t_ms)} - {keyframe.kind}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.8em' }}>
                    {keyframe.data?.url || 'No URL'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="card" style={{ marginTop: '16px' }}>
            <h4>Quick Stats</h4>
            <div style={{ fontSize: '0.9em' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Total Events:</strong> {events.length}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>LLM Calls:</strong> {events.filter(e => e.payload?.llm).length}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Clicks:</strong> {events.filter(e => e.kind === 'click').length}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Correlated Clicks:</strong> {events.filter(e => e.payload?.correlationId || e.payload?.correlationServer).length}
              </div>
            </div>
          </div>
          
          <div className="card" style={{ marginTop: '16px' }}>
            <h4>Diff Analysis</h4>
            <button 
              onClick={() => {
                // For demo purposes, compare with a hardcoded run ID
                // In production, this would show a list of recent runs
                const lastGreenRunId = prompt('Enter the run ID to compare against:');
                if (lastGreenRunId) {
                  fetchDiff(lastGreenRunId);
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: '500'
              }}
            >
              🔍 Diff with Another Run
            </button>
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: '8px', textAlign: 'center' }}>
              Compare semantic fingerprints
            </div>
          </div>
        </div>
        
        {/* Enhanced Replay Player */}
        <div style={{ marginTop: '24px' }}>
          <ReplayPlayer 
            keyframes={keyframes}
            events={events}
            selectedTime={selectedTime}
            onTimeChange={setSelectedTime}
          />
        </div>
      </div>
      
      {/* Diff Panel */}
      <div style={{ marginTop: '32px' }}>
        <DiffPanel runId={runId} />
      </div>
    </div>
  );
}
