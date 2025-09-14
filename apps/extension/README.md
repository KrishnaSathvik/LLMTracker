# AFR Extension (MV3)

- Passive hooks via injected page script
- Captures: LLM network calls (sampled), clicks, DOM fingerprints
- Correlation window: 5s
- Buffers events in service worker and uploads to API

## Configure
- Right click extension → Options (future)
- For now, set API URL and key via DevTools 'Application → Storage → chrome.storage.sync'

Keys used:
- `apiUrl` (default `http://localhost:4000`)
- `workspaceKey` (optional)
- `runId` (optional; otherwise created by API on first ingest)
