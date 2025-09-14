// Inject a page-level script to access the real window (fetch/XHR)
function injectScript() {
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('inject.js');
  s.onload = () => {
    console.log('AFR: inject.js loaded successfully');
    s.remove();
  };
  s.onerror = (e) => {
    console.error('AFR: Failed to load inject.js', e, 'URL:', s.src);
  };
  (document.head || document.documentElement).appendChild(s);
  console.log('AFR: Script injection attempted, URL:', s.src);
}

// Try immediate injection
injectScript();

// Also try on DOM ready as fallback
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectScript);
}

// Bridge messages from page -> extension
window.addEventListener('message', (e) => {
  // Only process AFR messages
  if (e.source !== window || !e.data || e.data.__afr !== true) return;
  
  console.log('AFR Content Script: Received AFR message', e.data.payload);
  console.log('AFR Content Script: Sending to service worker', e.data.payload);
  
  try {
    chrome.runtime.sendMessage({ type: 'AFR_EVENT', payload: e.data.payload });
  } catch (error) {
    // Extension context invalidated - this is normal during reloads
    console.log('AFR: Extension context invalidated (normal during reloads)');
  }
});
