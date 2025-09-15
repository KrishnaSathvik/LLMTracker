'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Trigger deployment

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    if (typeof window === 'undefined') return;
    
    const apiKey = localStorage.getItem('afr_api_key');
    const workspaceId = localStorage.getItem('afr_workspace_id');
    setIsAuthenticated(!!(apiKey && workspaceId));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LT</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">LLM Tracker</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link 
                  href="/app"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/auth"
                    className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
              🚀 Track LLM interactions with complete visibility
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Stop Guessing.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Start Tracking.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              The only platform that gives you <strong>complete visibility</strong> into your LLM interactions. 
              Track API calls, user behavior, and performance metrics in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                href="/auth"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                Start Free Trial →
              </Link>
              <Link 
                href="#demo"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Watch 2-Min Demo
              </Link>
            </div>
            
            {/* Value Proposition */}
            <div className="flex items-center justify-center space-x-8 text-gray-500 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Real-time tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Smart correlation</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Performance analytics</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full opacity-10"></div>
      </section>

      {/* Problem Section */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Are you flying blind with your LLM?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Most teams have no idea how their LLM interactions perform, what users actually do, or where the bottlenecks are.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">No Visibility</h3>
              <p className="text-gray-600">
                You can't see what users actually do with your LLM responses. Are they clicking? Scrolling? Getting confused?
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-red-500 text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Wasted Money</h3>
              <p className="text-gray-600">
                Paying for LLM tokens without knowing if they're actually helping users or just burning cash.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-red-500 text-4xl mb-4">🐛</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Silent Failures</h3>
              <p className="text-gray-600">
                Users abandon your app when LLM responses are slow or irrelevant, but you never know why.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get complete visibility in minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              LLM Tracker gives you the insights you need to optimize performance, reduce costs, and improve user experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Real-time Tracking</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                See every LLM API call, user interaction, and response in real-time. No more guessing what's happening.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> API call monitoring</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> User behavior tracking</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Response time analysis</li>
              </ul>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-green-50 to-green-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl">🔗</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Smart Correlation</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Automatically connect user actions to LLM responses. See the full user journey, not just isolated events.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Action-response mapping</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> User journey visualization</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Context-aware insights</li>
              </ul>
            </div>

            <div className="group">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Performance Analytics</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Get actionable insights to optimize costs, improve response times, and enhance user experience.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Cost optimization</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Performance metrics</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Usage patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get started in 2 minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No complex setup, no code changes. Just install our extension and start tracking immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Install Extension</h3>
              <p className="text-gray-600 leading-relaxed">
                Add our Chrome extension to your browser. Takes 30 seconds.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Connect API</h3>
              <p className="text-gray-600 leading-relaxed">
                Add your OpenAI/Anthropic API keys. We handle the rest.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Start Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Visit any website. We automatically capture all LLM interactions.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Get Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                View real-time dashboards with performance metrics and user behavior.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why choose LLM Tracker?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get the insights you need to optimize your LLM interactions and improve user experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Instant Setup</h3>
              <p className="text-gray-600">
                Install our Chrome extension and start tracking in under 2 minutes. No complex configuration required.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Complete Visibility</h3>
              <p className="text-gray-600">
                See every API call, user interaction, and response in real-time. No more guessing what's happening.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Actionable Insights</h3>
              <p className="text-gray-600">
                Get performance metrics and optimization recommendations to improve your LLM's effectiveness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple pricing that scales with you
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Perfect for testing</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Up to 1,000 events/month</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Basic analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">7-day data retention</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Community support</span>
                </li>
              </ul>
              <Link 
                href="/auth"
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl text-center font-semibold hover:bg-gray-200 transition-colors duration-200 block"
              >
                Get Started Free
              </Link>
            </div>

            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 relative hover:shadow-xl transition-shadow duration-200">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$29</div>
                <p className="text-gray-600">For growing teams</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Up to 50,000 events/month</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Advanced analytics & insights</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">90-day data retention</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Priority email support</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Team collaboration</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">API access</span>
                </li>
              </ul>
              <Link 
                href="/auth"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl text-center font-semibold hover:shadow-lg transition-all duration-200 block"
              >
                Start Pro Trial
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Custom</div>
                <p className="text-gray-600">For large organizations</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Unlimited events</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Custom analytics & reports</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Unlimited data retention</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Dedicated support</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  <span className="text-gray-700">SSO & advanced security</span>
                </li>
              </ul>
              <Link 
                href="/contact"
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl text-center font-semibold hover:bg-gray-200 transition-colors duration-200 block"
              >
                Contact Sales
              </Link>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include:</p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <span className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Chrome extension
              </span>
              <span className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Real-time tracking
              </span>
              <span className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Smart correlation
              </span>
              <span className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Data export
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to stop flying blind?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Get complete visibility into your LLM interactions. 
            Start tracking in 2 minutes, see results immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              href="/auth"
              className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1 shadow-xl"
            >
              Start Free Trial →
            </Link>
            <Link 
              href="#demo"
              className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Watch Demo
            </Link>
          </div>
          <p className="text-blue-200 text-sm">
            ✓ No credit card required ✓ Setup in 2 minutes ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LT</span>
                </div>
                <h3 className="text-xl font-bold">LLM Tracker</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The only platform that gives you complete visibility into your LLM interactions. 
                Track, analyze, and optimize your AI performance.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/changelog" className="text-gray-400 hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/status" className="text-gray-400 hover:text-white transition-colors">Status</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 LLM Tracker. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Made with ❤️ for AI teams</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}