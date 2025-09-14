'use client';

import React, { useState, useEffect } from 'react';

interface DiffResult {
  run1_id: string;
  run2_id: string;
  summary: {
    total_changes: number;
    changes: number;
    removed: number;
    added: number;
    disabled: number;
  };
  changes: Array<{
    selector: string;
    text: string;
    intent: string;
    enabled: boolean;
    changes: Record<string, { from: any; to: any }>;
  }>;
  removed: Array<{
    selector: string;
    text: string;
    intent: string;
    enabled: boolean;
  }>;
  added: Array<{
    selector: string;
    text: string;
    intent: string;
    enabled: boolean;
  }>;
  disabled: Array<{
    selector: string;
    text: string;
    intent: string;
  }>;
  probable_causes: Array<{
    type: string;
    message: string;
    elements?: any[];
    examples?: any[];
    severity: 'high' | 'medium' | 'low';
  }>;
}

interface LastGreenRun {
  last_green_run: {
    id: string;
    created_at: string;
    url: string;
    event_count: number;
    click_count: number;
    llm_count: number;
  };
  current_run: {
    id: string;
    url: string;
    created_at: string;
  };
}

interface DiffPanelProps {
  runId: string;
  apiKey?: string;
}

export default function DiffPanel({ runId, apiKey }: DiffPanelProps) {
  const [lastGreen, setLastGreen] = useState<LastGreenRun | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLastGreen = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['X-AFR-Key'] = apiKey;
      }
      
      const response = await fetch(`http://localhost:4000/runs/${runId}/last-green`, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('No previous successful run found for comparison');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setLastGreen(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch last green run');
    } finally {
      setLoading(false);
    }
  };

  const runDiff = async (againstRunId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (apiKey) {
        headers['X-AFR-Key'] = apiKey;
      }
      
      const response = await fetch(`http://localhost:4000/runs/${runId}/diff?against=${againstRunId}`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setDiffResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run diff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLastGreen();
  }, [runId]);

  if (loading && !diffResult) {
    return (
      <div className="bg-gray-50 border rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading diff analysis...</span>
        </div>
      </div>
    );
  }

  if (error && !lastGreen) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <div className="text-red-600">❌</div>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!lastGreen) {
    return null;
  }

  const handleDiffWithLastGreen = () => {
    runDiff(lastGreen.last_green_run.id);
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Diff Analysis</h3>
        {!diffResult && (
          <button
            onClick={handleDiffWithLastGreen}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Diff with Last Green'}
          </button>
        )}
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Last Successful Run</h4>
        <div className="text-sm text-gray-600">
          <p><strong>Date:</strong> {new Date(lastGreen.last_green_run.created_at).toLocaleString()}</p>
          <p><strong>URL:</strong> {lastGreen.last_green_run.url}</p>
          <p><strong>Events:</strong> {lastGreen.last_green_run.event_count}</p>
          <p><strong>Clicks:</strong> {lastGreen.last_green_run.click_count}</p>
          <p><strong>LLM Calls:</strong> {lastGreen.last_green_run.llm_count}</p>
        </div>
      </div>

      {diffResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-800">Total Changes</div>
                <div className="text-blue-600">{diffResult.summary.total_changes}</div>
              </div>
              <div>
                <div className="font-medium text-blue-800">Modified</div>
                <div className="text-blue-600">{diffResult.summary.changes}</div>
              </div>
              <div>
                <div className="font-medium text-red-800">Removed</div>
                <div className="text-red-600">{diffResult.summary.removed}</div>
              </div>
              <div>
                <div className="font-medium text-green-800">Added</div>
                <div className="text-green-600">{diffResult.summary.added}</div>
              </div>
              <div>
                <div className="font-medium text-orange-800">Disabled</div>
                <div className="text-orange-600">{diffResult.summary.disabled}</div>
              </div>
            </div>
          </div>

          {/* Probable Causes */}
          {diffResult.probable_causes.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Probable Causes</h4>
              {diffResult.probable_causes.map((cause, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    cause.severity === 'high' ? 'border-red-200 bg-red-50' :
                    cause.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`text-lg ${
                      cause.severity === 'high' ? 'text-red-600' :
                      cause.severity === 'medium' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {cause.severity === 'high' ? '🔴' : cause.severity === 'medium' ? '🟡' : '🔵'}
                    </div>
                    <div>
                      <div className={`font-medium ${
                        cause.severity === 'high' ? 'text-red-800' :
                        cause.severity === 'medium' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {cause.message}
                      </div>
                      {cause.examples && cause.examples.length > 0 && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium">Examples:</div>
                          {cause.examples.map((example, idx) => (
                            <div key={idx} className="mt-1 text-gray-600">
                              <code className="bg-gray-100 px-1 rounded">{example.selector}</code>
                              {example.textChange && (
                                <span className="ml-2">
                                  "{example.textChange.from}" → "{example.textChange.to}"
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detailed Changes */}
          {diffResult.changes.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Element Changes</h4>
              <div className="space-y-2">
                {diffResult.changes.map((change, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="font-mono text-sm text-gray-800 mb-2">{change.selector}</div>
                    <div className="text-sm text-gray-600">
                      <div><strong>Text:</strong> {change.text}</div>
                      <div><strong>Intent:</strong> {change.intent}</div>
                      <div><strong>Enabled:</strong> {change.enabled ? 'Yes' : 'No'}</div>
                      {Object.entries(change.changes).map(([key, value]) => (
                        <div key={key} className="mt-1">
                          <strong>{key}:</strong> "{value.from}" → "{value.to}"
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Elements */}
          {diffResult.removed.length > 0 && (
            <div>
              <h4 className="font-medium text-red-800 mb-3">Removed Elements</h4>
              <div className="space-y-2">
                {diffResult.removed.map((element, index) => (
                  <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-3">
                    <div className="font-mono text-sm text-red-800 mb-1">{element.selector}</div>
                    <div className="text-sm text-red-700">
                      <div><strong>Text:</strong> {element.text}</div>
                      <div><strong>Intent:</strong> {element.intent}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disabled Elements */}
          {diffResult.disabled.length > 0 && (
            <div>
              <h4 className="font-medium text-orange-800 mb-3">Disabled Elements</h4>
              <div className="space-y-2">
                {diffResult.disabled.map((element, index) => (
                  <div key={index} className="border border-orange-200 bg-orange-50 rounded-lg p-3">
                    <div className="font-mono text-sm text-orange-800 mb-1">{element.selector}</div>
                    <div className="text-sm text-orange-700">
                      <div><strong>Text:</strong> {element.text}</div>
                      <div><strong>Intent:</strong> {element.intent}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && diffResult && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600">❌</div>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
