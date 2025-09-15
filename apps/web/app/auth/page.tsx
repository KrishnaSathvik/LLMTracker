'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    workspaceName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        // Create workspace and user account
        const workspaceResponse = await fetch(`${API}/workspaces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.workspaceName })
        });
        
        const workspace = await workspaceResponse.json();
        
        // Generate API key
        const keyResponse = await fetch(`${API}/workspaces/${workspace.workspace.id}/keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Default Key' })
        });
        
        const apiKey = await keyResponse.json();
        
        // Store in localStorage for demo (in production, use proper auth)
        if (typeof window !== 'undefined') {
          localStorage.setItem('afr_workspace_id', workspace.workspace.id);
          localStorage.setItem('afr_api_key', apiKey.apiKey.key);
          localStorage.setItem('afr_workspace_name', formData.workspaceName);
        }
        
        router.push('/app');
      } else {
        // Login flow - in production, implement proper authentication
        setError('Login not implemented yet. Please sign up for a new workspace.');
      }
    } catch (err) {
      setError('Failed to create workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'signup' ? 'Get Started with LLM Tracker' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'signup' 
              ? 'Create your workspace to start tracking LLM interactions'
              : 'Access your LLM Tracker workspace'
            }
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700">
                  Workspace Name
                </label>
                <input
                  id="workspaceName"
                  name="workspaceName"
                  type="text"
                  required
                  value={formData.workspaceName}
                  onChange={(e) => setFormData({...formData, workspaceName: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Company"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@company.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : (mode === 'signup' ? 'Create Workspace' : 'Sign In')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              {mode === 'signup' 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Quick Start</span>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Want to try it first? 
              <button 
                onClick={() => {
                  // Demo mode - create temporary workspace
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('afr_demo_mode', 'true');
                  }
                  router.push('/app');
                }}
                className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
              >
                Try Demo Mode
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
