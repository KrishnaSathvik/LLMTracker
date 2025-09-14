// Default settings
const DEFAULT_SETTINGS = {
  apiUrl: 'https://api.llmtracker.dev',
  workspaceKey: '',
  allowedDomains: [],
  redactEmails: true,
  redactTokens: true,
  redactPII: true,
  customRedaction: '',
  retentionDays: 30,
  flagPII: true,
  auditMode: false
};

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    
    // Populate form fields
    document.getElementById('apiUrl').value = settings.apiUrl || '';
    document.getElementById('workspaceKey').value = settings.workspaceKey || '';
    document.getElementById('redactEmails').checked = settings.redactEmails !== false;
    document.getElementById('redactTokens').checked = settings.redactTokens !== false;
    document.getElementById('redactPII').checked = settings.redactPII !== false;
    document.getElementById('customRedaction').value = settings.customRedaction || '';
    document.getElementById('retentionDays').value = settings.retentionDays || 30;
    document.getElementById('flagPII').checked = settings.flagPII !== false;
    document.getElementById('auditMode').checked = settings.auditMode || false;
    
    // Populate domain list
    updateDomainList(settings.allowedDomains || []);
    
  } catch (error) {
    showStatus('Error loading settings: ' + error.message, 'error');
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    const settings = {
      apiUrl: document.getElementById('apiUrl').value.trim(),
      workspaceKey: document.getElementById('workspaceKey').value.trim(),
      allowedDomains: getAllowedDomains(),
      redactEmails: document.getElementById('redactEmails').checked,
      redactTokens: document.getElementById('redactTokens').checked,
      redactPII: document.getElementById('redactPII').checked,
      customRedaction: document.getElementById('customRedaction').value.trim(),
      retentionDays: parseInt(document.getElementById('retentionDays').value),
      flagPII: document.getElementById('flagPII').checked,
      auditMode: document.getElementById('auditMode').checked
    };
    
    // Validate settings
    if (settings.apiUrl && !isValidUrl(settings.apiUrl)) {
      showStatus('Invalid API URL', 'error');
      return;
    }
    
    await chrome.storage.sync.set(settings);
    showStatus('Settings saved successfully!', 'success');
    
    // Notify content scripts of settings change
    chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings });
    
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

// Reset settings to defaults
async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    try {
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set(DEFAULT_SETTINGS);
      loadSettings();
      showStatus('Settings reset to defaults', 'success');
    } catch (error) {
      showStatus('Error resetting settings: ' + error.message, 'error');
    }
  }
}

// Export settings as JSON
async function exportSettings() {
  try {
    const settings = await chrome.storage.sync.get();
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'afr-settings.json';
    link.click();
    
    showStatus('Settings exported successfully!', 'success');
  } catch (error) {
    showStatus('Error exporting settings: ' + error.message, 'error');
  }
}

// Import settings from JSON file
async function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const settings = JSON.parse(text);
      
      // Validate imported settings
      if (typeof settings !== 'object') {
        throw new Error('Invalid settings file format');
      }
      
      await chrome.storage.sync.set(settings);
      loadSettings();
      showStatus('Settings imported successfully!', 'success');
      
    } catch (error) {
      showStatus('Error importing settings: ' + error.message, 'error');
    }
  };
  
  input.click();
}

// Domain management
function updateDomainList(domains) {
  const domainList = document.getElementById('domainList');
  
  if (domains.length === 0) {
    domainList.innerHTML = `
      <div style="color: #6b7280; text-align: center; padding: 20px;">
        No domains configured - capturing all sites
      </div>
    `;
    return;
  }
  
  domainList.innerHTML = domains.map(domain => `
    <div class="domain-item">
      <span>${domain}</span>
      <button class="remove-domain" onclick="removeDomain('${domain}')">Remove</button>
    </div>
  `).join('');
}

function addDomain() {
  const input = document.getElementById('newDomain');
  const domain = input.value.trim().toLowerCase();
  
  if (!domain) return;
  
  if (!isValidDomain(domain)) {
    showStatus('Invalid domain format', 'error');
    return;
  }
  
  const currentDomains = getAllowedDomains();
  if (currentDomains.includes(domain)) {
    showStatus('Domain already exists', 'error');
    return;
  }
  
  currentDomains.push(domain);
  updateDomainList(currentDomains);
  input.value = '';
  showStatus('Domain added', 'success');
}

function removeDomain(domain) {
  const currentDomains = getAllowedDomains().filter(d => d !== domain);
  updateDomainList(currentDomains);
  showStatus('Domain removed', 'success');
}

function getAllowedDomains() {
  const domainItems = document.querySelectorAll('.domain-item span');
  return Array.from(domainItems).map(item => item.textContent);
}

// Utility functions
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidDomain(domain) {
  // Simple domain validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 3000);
}

// Initialize options page
document.addEventListener('DOMContentLoaded', loadSettings);

// Add enter key support for domain input
document.getElementById('newDomain').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addDomain();
  }
});
