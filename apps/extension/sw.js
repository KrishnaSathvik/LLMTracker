let BUF = [];
let lastUrl = null;
let runId = null;

async function getCfg() {
  const { apiUrl, workspaceKey } = await chrome.storage.sync.get(['apiUrl','workspaceKey']);
  return {
    apiUrl: apiUrl || 'https://api.llmtracker.dev',
    workspaceKey: workspaceKey || null
  };
}

chrome.runtime.onMessage.addListener((msg) => {
  console.log('AFR Service Worker: Received message', msg);
  if (msg?.type === 'AFR_EVENT') {
    const t = Date.now();
    BUF.push({ t, ...msg.payload });
    console.log('AFR Service Worker: Added to buffer', { t, payload: msg.payload });
    
    // Handle keyframe events separately
    if (msg.payload?.kind === 'keyframe') {
      uploadKeyframe(msg.payload);
    }
  }
});

chrome.webNavigation.onCommitted.addListener(({ url }) => { lastUrl = url; });

async function uploadKeyframe(keyframePayload) {
  if (!runId) {
    console.log('AFR Service Worker: No runId yet, skipping keyframe upload');
    return;
  }
  
  const cfg = await getCfg();
  const payload = {
    t_ms: keyframePayload.t || Date.now(),
    kind: keyframePayload.data?.kind || 'snapshot',
    data: keyframePayload.data
  };
  
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.workspaceKey) {
      headers['X-AFR-Key'] = cfg.workspaceKey;
    }
    
    const res = await fetch(`${cfg.apiUrl}/runs/${runId}/keyframes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('AFR Service Worker: Keyframe uploaded', data);
  } catch (e) {
    console.error('AFR Service Worker: Keyframe upload failed', e);
  }
}

async function flush() {
  if (!BUF.length) return;
  const batch = BUF.splice(0, BUF.length);
  const cfg = await getCfg();

  const payload = { events: batch, context: { url: lastUrl } };
  if (runId) payload.runId = runId;

  console.log('AFR Service Worker: Flushing batch', { batchLength: batch.length, url: lastUrl });

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (cfg.workspaceKey) {
      headers['X-AFR-Key'] = cfg.workspaceKey;
    }
    
    const res = await fetch(cfg.apiUrl + '/ingest', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('AFR Service Worker: Flush successful', data);
    if (!runId && data?.runId) runId = data.runId;
  } catch (e) {
    // drop on floor for MVP
    console.error('AFR flush err', e);
  }
}
setInterval(flush, 1500);
