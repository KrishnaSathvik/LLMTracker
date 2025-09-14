(function() {
  console.log('AFR: Injected script loaded');
  window.__AFR_LOADED = true;
  
  // rrweb recording setup
  let rrwebRecorder = null;
  let rrwebEvents = [];
  
  // Load rrweb dynamically
  const loadRRWeb = async () => {
    try {
      // Load rrweb from CDN
      if (typeof window.rrweb === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/rrweb@2.0.0-alpha.4/dist/rrweb.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      
      console.log('AFR: rrweb recording initialized');
      return true;
    } catch (e) {
      console.error('AFR: Failed to load rrweb', e);
      return false;
    }
  };
  
  // Initialize recording
  console.log('AFR: Starting initialization...');
  loadRRWeb().then(loaded => {
    console.log('AFR: RRWeb loaded:', loaded);
    loadPrivacySettings().then(() => {
      console.log('AFR: Privacy settings loaded:', privacySettings);
      const domainAllowed = isDomainAllowed();
      console.log('AFR: Domain allowed:', domainAllowed, 'for hostname:', window.location.hostname);
      
      if (loaded && domainAllowed) {
        console.log('AFR: Starting recording...');
        startRecording();
      } else if (!domainAllowed) {
        console.log('AFR: Domain not in allowlist, skipping recording');
      } else {
        console.log('AFR: RRWeb not loaded, skipping recording');
      }
    });
  });
  
  function startRecording() {
    // Start rrweb recording if available
    if (window.rrweb && window.rrweb.record) {
      console.log('AFR: Starting rrweb recording');
      
      rrwebRecorder = window.rrweb.record({
        emit(event) {
          console.log('AFR: rrweb event captured', event.type);
          rrwebEvents.push(event);
          
          // Send keyframes for full snapshots and every 30 events
          if (event.type === 4 || rrwebEvents.length % 30 === 0) { // Type 4 = Full snapshot
            const keyframeData = {
              kind: event.type === 4 ? 'full_snapshot' : 'incremental',
              timestamp: event.timestamp,
              rrwebEvent: event,
              url: window.location.href,
              title: document.title,
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight
              }
            };
            
            send({ 
              kind: 'keyframe', 
              data: keyframeData,
              t: Date.now()
            });
          }
        },
        checkoutEveryNms: 30000, // Take full snapshot every 30 seconds
        recordCanvas: true,
        collectFonts: true,
        recordCrossOriginIframes: false
      });
      
      console.log('AFR: rrweb recording started successfully');
    } else {
      console.log('AFR: rrweb not available, using fallback capture');
    }
    
    // Fallback keyframe capture for compatibility
    const captureKeyframe = (kind = 'navigation') => {
      const snapshot = {
        kind,
        timestamp: Date.now(),
        url: window.location.href,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        // Simplified DOM snapshot - in production this would be full rrweb snapshot
        domSnapshot: {
          elementCount: document.querySelectorAll('*').length,
          textContent: document.body?.innerText?.slice(0, 1000) || '',
          links: Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => ({
            href: a.href,
            text: a.textContent?.slice(0, 50)
          })),
          buttons: Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]')).slice(0, 10).map(b => ({
            text: b.textContent?.slice(0, 50) || b.value,
            disabled: b.disabled
          }))
        }
      };
      
      rrwebEvents.push(snapshot);
      
      // Send to extension
      send({ 
        kind: 'keyframe', 
        data: snapshot,
        t: Date.now()
      });
      
      console.log('AFR: Keyframe captured', { kind, timestamp: snapshot.timestamp });
    };
    
    // Capture initial snapshot
    captureKeyframe('initial');
    
    // Capture on navigation
    let lastUrl = window.location.href;
    const checkNavigation = () => {
      if (window.location.href !== lastUrl) {
        captureKeyframe('navigation');
        lastUrl = window.location.href;
      }
    };
    
    // Check for navigation periodically
    setInterval(checkNavigation, 1000);
    
    // Capture on significant DOM changes
    let domChangeCount = 0;
    const domObserver = new MutationObserver(() => {
      domChangeCount++;
      if (domChangeCount % 50 === 0) { // Capture every 50 changes
        captureKeyframe('dom_change');
      }
    });
    
    domObserver.observe(document, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['class', 'style', 'disabled']
    });
    
    // Capture before page unload
    window.addEventListener('beforeunload', () => {
      captureKeyframe('unload');
    });
  }
  
  const LLM_HOSTS = [
    // OpenAI
    /api\.openai\.com\/v1\/(chat|responses|completions)/i,
    /api\.openai\.com\/v1\/embeddings/i,
    /api\.openai\.com\/v1\/images/i,
    
    // Anthropic Claude
    /api\.anthropic\.com\/v1\/messages/i,
    
    // Google Gemini
    /generativelanguage\.googleapis\.com/i,
    /ai\.google\.dev/i,
    /vertex-ai\.googleapis\.com/i,
    
    // Hugging Face
    /api\.huggingface\.co\/models/i,
    /huggingface\.co\/api\/inference/i,
    
    // Perplexity
    /api\.perplexity\.ai/i,
    
    // Cohere
    /api\.cohere\.ai/i,
    
    // Replicate
    /api\.replicate\.com/i,
    
    // Groq
    /api\.groq\.com/i,
    
    // Together AI
    /api\.together\.xyz/i,
    
    // Mistral
    /api\.mistral\.ai/i,
    
    // AI21
    /api\.ai21\.com/i,
    
    // DeepSeek
    /api\.deepseek\.com/i,
    
    // Generic AI patterns
    /\/v1\/(chat|completions|embeddings|images)/i,
    /\/api\/v\d+\/(generate|chat|complete)/i,
    /\/inference/i,
    /\/predict/i,
    /\/generate/i
  ];
  
  const isLLM = (url) => LLM_HOSTS.some(r => r.test(url));
  
  // Enhanced LLM detection with confidence scoring
  const detectLLMProvider = (url) => {
    const providers = {
      openai: /api\.openai\.com/i,
      anthropic: /api\.anthropic\.com/i,
      google: /(generativelanguage\.googleapis\.com|ai\.google\.dev|vertex-ai\.googleapis\.com)/i,
      huggingface: /(api\.huggingface\.co|huggingface\.co\/api)/i,
      perplexity: /api\.perplexity\.ai/i,
      cohere: /api\.cohere\.ai/i,
      replicate: /api\.replicate\.com/i,
      groq: /api\.groq\.com/i,
      together: /api\.together\.xyz/i,
      mistral: /api\.mistral\.ai/i,
      ai21: /api\.ai21\.com/i,
      deepseek: /api\.deepseek\.com/i
    };
    
    for (const [provider, pattern] of Object.entries(providers)) {
      if (pattern.test(url)) return provider;
    }
    return 'unknown';
  };

  const send = (payload) => window.postMessage({ __afr: true, payload }, "*");

  // --- Correlation engine (client-side) ---
  const correlationWindow = 5000; // 5s window
  const pendingCalls = []; // {id, t0, url, method, llm}
  const nowMs = () => Date.now();
  const newCorrId = () => `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  const recordCall = (url, method, llm) => {
    const id = newCorrId();
    const provider = llm ? detectLLMProvider(url) : null;
    const confidence = llm ? (provider !== 'unknown' ? 0.9 : 0.5) : 0;
    
    pendingCalls.push({ 
      id, 
      t0: nowMs(), 
      url, 
      method, 
      llm, 
      provider,
      confidence 
    });
    
    // cleanup old calls
    const cutoff = nowMs() - correlationWindow;
    while (pendingCalls.length && pendingCalls[0].t0 < cutoff) pendingCalls.shift();
    return id;
  };

  const findCorrelated = () => {
    const cutoff = nowMs() - correlationWindow;
    let bestMatch = null;
    let bestScore = 0;
    
    for (let i = pendingCalls.length - 1; i >= 0; i--) {
      const c = pendingCalls[i];
      if (c.t0 < cutoff) break;
      
      if (c.llm) {
        // Score based on confidence and recency
        const recencyScore = 1 - ((nowMs() - c.t0) / correlationWindow);
        const totalScore = (c.confidence || 0.5) * 0.7 + recencyScore * 0.3;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMatch = c;
        }
      }
    }
    
    return bestMatch ? bestMatch.id : null;
  };

  // --- Privacy settings and redaction ---
  let privacySettings = {
    allowedDomains: [],
    redactEmails: true,
    redactTokens: true,
    redactPII: true,
    customRedaction: [],
    flagPII: true,
    auditMode: false
  };
  
  // Load privacy settings
  const loadPrivacySettings = async () => {
    try {
      const settings = await chrome.storage.sync.get();
      privacySettings = {
        allowedDomains: settings.allowedDomains || [],
        redactEmails: settings.redactEmails !== false,
        redactTokens: settings.redactTokens !== false,
        redactPII: settings.redactPII !== false,
        customRedaction: settings.customRedaction ? settings.customRedaction.split('\n').filter(r => r.trim()) : [],
        flagPII: settings.flagPII !== false,
        auditMode: settings.auditMode || false
      };
    } catch (e) {
      console.log('AFR: Using default privacy settings');
    }
  };
  
  // Check if current domain is allowed
  const isDomainAllowed = () => {
    if (privacySettings.allowedDomains.length === 0) return true;
    const hostname = window.location.hostname;
    return privacySettings.allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  };
  
  // Enhanced redaction with privacy settings
  const scrub = (s) => {
    if (!s) return null;
    
    let redacted = s;
    
    // Email redaction
    if (privacySettings.redactEmails) {
      redacted = redacted.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, "[email]");
    }
    
    // Token redaction
    if (privacySettings.redactTokens) {
      redacted = redacted.replace(/(?:bearer\\s+)?[a-z0-9-_]{20,}\\.[a-z0-9-_]{10,}\\.[a-z0-9-_]{10,}/ig, "[jwt]");
      redacted = redacted.replace(/[a-zA-Z0-9]{32,}/g, "[token]");
    }
    
    // PII redaction
    if (privacySettings.redactPII) {
      redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn]");
      redacted = redacted.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[cc]");
      redacted = redacted.replace(/\b\d{3}-\d{3}-\d{4}\b/g, "[phone]");
    }
    
    // Custom redaction patterns
    privacySettings.customRedaction.forEach(pattern => {
      try {
        const regex = new RegExp(pattern, 'gi');
        redacted = redacted.replace(regex, '[REDACTED]');
      } catch (e) {
        console.warn('AFR: Invalid redaction pattern:', pattern);
      }
    });
    
    return redacted.length > 2000 ? redacted.slice(0, 2000) + "…" : redacted;
  };
  
  // Check for PII on screen
  const checkPIIOnScreen = () => {
    if (!privacySettings.flagPII) return null;
    
    const text = document.body?.innerText || '';
    const piiFlags = [];
    
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) {
      piiFlags.push('email');
    }
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
      piiFlags.push('ssn');
    }
    if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) {
      piiFlags.push('credit_card');
    }
    if (/\b\d{3}-\d{3}-\d{4}\b/.test(text)) {
      piiFlags.push('phone');
    }
    
    return piiFlags.length > 0 ? piiFlags : null;
  };
  
  // Privacy settings are initialized above

  // --- fetch hook ---
  const origFetch = window.fetch;
  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    const method = (init.method || 'GET').toUpperCase();
    const t0 = performance.now();

    let reqBody = null;
    try { if (init.body && typeof init.body === 'string') reqBody = init.body; } catch {}

           const llm = isLLM(url);
           const corrId = recordCall(url, method, llm);
           const provider = llm ? detectLLMProvider(url) : null;
           
           send({ 
             kind: 'network', 
             url, 
             method, 
             llm, 
             provider,
             corrId, 
             req: { size: reqBody?.length || null, body: scrub(reqBody) } 
           });

    const res = await origFetch(input, init);
    const t1 = performance.now();

    let sample = null;
    try {
      const r2 = res.clone();
      if (r2.body && isLLM(url)) {
        const [s1] = r2.body.tee();
        const reader = s1.getReader();
        const chunks = [];
        const dec = new TextDecoder();
        let got = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(dec.decode(value, { stream: true }));
          if ((got += value.length) > 64 * 1024) break;
        }
        sample = scrub(chunks.join(""));
      }
    } catch {}

           send({ 
             kind: 'network', 
             url, 
             method, 
             llm: isLLM(url), 
             provider: llm ? detectLLMProvider(url) : null,
             corrId, 
             res: { status: res.status, sample }, 
             durMs: Math.round(t1 - t0) 
           });
    return res;
  };

  // --- XHR hook ---
  const OrigXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OrigXHR();
    let url, method = 'GET', bodyText;
    const corrId = () => recordCall(url || '', method, isLLM(url || ''));

    const open = xhr.open;
    xhr.open = function(m, u) { method = m; url = u; return open.apply(xhr, arguments); };

    const sendOrig = xhr.send;
    xhr.send = function(body) {
      bodyText = (typeof body === 'string') ? body : null;
           const id = corrId();
           const llm = isLLM(url || '');
           send({ 
             kind: 'network', 
             url, 
             method, 
             llm, 
             provider: llm ? detectLLMProvider(url || '') : null,
             corrId: id, 
             req: { size: bodyText?.length || null, body: scrub(bodyText) } 
           });
      return sendOrig.apply(xhr, arguments);
    };

    xhr.addEventListener('loadend', () => {
      const llm = isLLM(url || '');
      send({ 
        kind: 'network', 
        url, 
        method, 
        llm, 
        provider: llm ? detectLLMProvider(url || '') : null,
        res: { status: xhr.status, sample: scrub(xhr.responseText?.slice(0, 2000) || '') } 
      });
    });
    return xhr;
  };

  // --- Semantic fingerprinting + DOM observers ---
  const robustSelector = (el) => {
    if (!el) return null;
    if (el.id) return `#${el.id}`;
    const name = el.localName;
    const idx = Array.from(el.parentNode?.children || []).indexOf(el) + 1;
    return `${name}:nth-child(${idx})`;
  };

  const classifyIntent = (el) => {
    const text = ((el.textContent || el.value || '') + '').toLowerCase();
    const type = (el.type || el.tagName || '').toLowerCase();
    if (/submit|save|confirm|ok|yes/.test(text)) return 'submit';
    if (/cancel|back|no|close/.test(text)) return 'cancel';
    if (type === 'input' || ['input','textarea','select'].includes(type)) return 'input';
    if (/download|export|get/.test(text)) return 'download';
    return 'nav';
  };

  const semanticFingerprint = () => {
    const sel = 'button,input,select,a,[role="button"]';
    const nodes = Array.from(document.querySelectorAll(sel)).slice(0, 500);
    const actionables = nodes.map(el => ({
      selector: robustSelector(el),
      intent: classifyIntent(el),
      text: (el.textContent || '').trim().slice(0,80),
      enabled: !(el.disabled || el.readOnly)
    }));
    const layoutHash = String(actionables.length) + ':' + (document.body?.innerText?.length || 0);
    return { actionables, layoutHash };
  };

  const postFingerprint = () => {
    const fp = semanticFingerprint();
    const piiFlags = checkPIIOnScreen();
    
    const fingerprintData = { ...fp };
    if (piiFlags) {
      fingerprintData.piiFlags = piiFlags;
      fingerprintData.piiTimestamp = Date.now();
    }
    
    send({ kind: 'dom_fp', ...fingerprintData });
  };

  document.addEventListener('click', (e) => {
    const corr = findCorrelated();
    const clickData = {
      kind: 'click',
      selector: robustSelector(e.target),
      text: (e.target.innerText || '').trim().slice(0, 120),
      correlationId: corr
    };
    console.log('AFR: Click detected', clickData);
    send(clickData);
  }, { capture: true });

  const mo = new MutationObserver(() => postFingerprint());
  mo.observe(document, { childList: true, subtree: true });
  postFingerprint();
})();
