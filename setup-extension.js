#!/usr/bin/env node

/**
 * Quick setup script for Agent Flight Recorder Extension
 * This script helps configure the extension with the correct API key
 */

const WORKSPACE_KEY = 'afr_d94d4f76997543508f6bfed289bbdffb';
const API_URL = 'http://localhost:4000';

console.log('🔧 Agent Flight Recorder Extension Setup');
console.log('=====================================');
console.log('');
console.log('📋 Manual Setup Instructions:');
console.log('');
console.log('1. Load the extension:');
console.log('   • Open Chrome and go to chrome://extensions/');
console.log('   • Enable "Developer mode"');
console.log('   • Click "Load unpacked"');
console.log('   • Select: /Users/krishnasathvikmantripragada/agent-flight-recorder/apps/extension/dist/');
console.log('');
console.log('2. Configure the extension:');
console.log('   • Click the extension icon in Chrome toolbar');
console.log('   • Click "Options" or right-click → Options');
console.log('   • Set API URL:', API_URL);
console.log('   • Set Workspace Key:', WORKSPACE_KEY);
console.log('   • Click "Save Settings"');
console.log('');
console.log('3. Test the system:');
console.log('   • Visit: http://localhost:8080/test-llm');
console.log('   • Interact with the page (click buttons, trigger API calls)');
console.log('   • Check the viewer: http://localhost:3000');
console.log('');
console.log('🎯 Expected Results:');
console.log('   • Extension should capture rrweb snapshots');
console.log('   • API calls should be recorded with correlation');
console.log('   • Viewer should show enhanced replay player');
console.log('   • Timeline should have event markers');
console.log('   • Play/pause/seek should work with visual replay');
console.log('');
console.log('🚀 Ready to test! The web app is now fixed and should work properly.');
