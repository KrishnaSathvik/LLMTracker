import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { randomUUID } from 'crypto';
import { pool, initDb } from './db.js';
import { IngestSchema } from './types.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

const app = Fastify({ 
  logger: process.env.NODE_ENV === 'production' ? false : true,
  trustProxy: true
});
await initDb();
await app.register(cors, { 
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000']
});

// API Key authentication middleware
async function authenticateApiKey(request: any, reply: any) {
  const apiKey = request.headers['x-afr-key'];
  if (!apiKey) {
    reply.code(401).send({ error: 'API key required' });
    return;
  }

  const { rows } = await pool.query(
    'select workspace_id from api_keys where key = $1',
    [apiKey]
  );

  if (rows.length === 0) {
    reply.code(401).send({ error: 'Invalid API key' });
    return;
  }

  (request as any).workspaceId = rows[0].workspace_id;
}

// Health
app.get('/health', async () => ({ ok: true }));

// Workspace management
app.post('/workspaces', async (req, reply) => {
  const { name } = req.body as { name: string };
  const { rows } = await pool.query(
    'insert into workspaces (name) values ($1) returning id, name, created_at',
    [name]
  );
  return { workspace: rows[0] };
});

app.post('/workspaces/:workspaceId/keys', async (req, reply) => {
  const { workspaceId } = req.params as { workspaceId: string };
  const { name } = req.body as { name?: string };
  const key = `afr_${randomUUID().replace(/-/g, '')}`;
  
  const { rows } = await pool.query(
    'insert into api_keys (workspace_id, key, name) values ($1, $2, $3) returning id, key, name, created_at',
    [workspaceId, key, name || 'Default Key']
  );
  return { apiKey: rows[0] };
});

app.get('/workspaces/:workspaceId/keys', async (req, reply) => {
  const { workspaceId } = req.params as { workspaceId: string };
  const { rows } = await pool.query(
    'select id, name, created_at from api_keys where workspace_id = $1 order by created_at desc',
    [workspaceId]
  );
  return { apiKeys: rows };
});

// Ingest
app.post('/ingest', { preHandler: authenticateApiKey }, async (req, reply) => {
  const parsed = IngestSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }
  const { runId: maybeRunId, context, events } = parsed.data;
  const runId = maybeRunId || randomUUID();

  if (!maybeRunId) {
    await pool.query('insert into runs(id, workspace_id, url, meta) values($1, $2, $3, $4)', [
      runId, (req as any).workspaceId, context?.url || null, JSON.stringify({})
    ]);
  }

  // Normalize timestamps
  const t0 = Date.now();
  const rows = events.map((e) => ({
    t_ms: typeof e.t === 'number' ? e.t : 0,
    kind: e.kind,
    payload: e
  }));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of rows) {
      await client.query(
        'insert into events(run_id, t_ms, kind, payload) values($1, $2, $3, $4)',
        [runId, r.t_ms, r.kind, r.payload]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return { ok: true, runId };
});

// List runs
app.get('/runs', { preHandler: authenticateApiKey }, async (req, reply) => {
  const query = req.query as any;
  const limit = Math.min(parseInt(query.limit) || 100, 1000);
  const offset = parseInt(query.offset) || 0;
  
  const { rows } = await pool.query(
    'select id, created_at, url from runs where workspace_id = $1 order by created_at desc limit $2 offset $3',
    [(req as any).workspaceId, limit, offset]
  );
  return rows;
});

// Run detail
app.get('/runs/:id', async (req, reply) => {
  // @ts-ignore
  const runId = req.params.id as string;
  const { rows } = await pool.query('select id, created_at, url, meta from runs where id=$1', [runId]);
  if (rows.length === 0) return reply.code(404).send({ error: 'not found' });
  return rows[0];
});

// Semantic diff between two runs
app.get('/runs/:id/diff', { preHandler: authenticateApiKey }, async (req, reply) => {
  // @ts-ignore
  const runId = req.params.id as string;
  const query = req.query as any;
  const against = query.against as string;
  
  if (!against) {
    return reply.code(400).send({ error: 'against parameter required' });
  }
  
  // Get DOM fingerprints from both runs
  const { rows: run1Fps } = await pool.query(`
    select payload from events 
    where run_id = $1 and kind = 'dom_fp' 
    order by t_ms
  `, [runId]);
  
  const { rows: run2Fps } = await pool.query(`
    select payload from events 
    where run_id = $1 and kind = 'dom_fp' 
    order by t_ms
  `, [against]);
  
  if (run1Fps.length === 0 || run2Fps.length === 0) {
    return reply.code(404).send({ error: 'One or both runs have no DOM fingerprints' });
  }
  
  // Extract semantic fingerprints
  const fps1 = run1Fps.map((row: any) => row.payload).filter((fp: any) => fp.text && fp.selector);
  const fps2 = run2Fps.map((row: any) => row.payload).filter((fp: any) => fp.text && fp.selector);
  
  // Compare fingerprints
  const changes = [];
  const removed = [];
  const added = [];
  const disabled = [];
  
  // Create maps for efficient lookup
  const map1 = new Map(fps1.map((fp: any) => [fp.selector, fp]));
  const map2 = new Map(fps2.map((fp: any) => [fp.selector, fp]));
  
  // Find changes and removals
  for (const [selector, fp1] of map1) {
    const fp2 = map2.get(selector);
    
    if (!fp2) {
      removed.push({
        selector,
        text: (fp1 as any).text,
        intent: (fp1 as any).intent,
        enabled: (fp1 as any).enabled
      });
    } else {
      // Check for changes
      const change: any = {};
      if ((fp1 as any).text !== (fp2 as any).text) change.text = { from: (fp1 as any).text, to: (fp2 as any).text };
      if ((fp1 as any).intent !== (fp2 as any).intent) change.intent = { from: (fp1 as any).intent, to: (fp2 as any).intent };
      if ((fp1 as any).enabled !== (fp2 as any).enabled) {
        change.enabled = { from: (fp1 as any).enabled, to: (fp2 as any).enabled };
        if (!(fp2 as any).enabled) disabled.push({ selector, text: (fp2 as any).text, intent: (fp2 as any).intent });
      }
      
      if (Object.keys(change).length > 0) {
        changes.push({
          selector,
          text: (fp2 as any).text,
          intent: (fp2 as any).intent,
          enabled: (fp2 as any).enabled,
          changes: change
        });
      }
    }
  }
  
  // Find additions
  for (const [selector, fp2] of map2) {
    if (!map1.has(selector)) {
      added.push({
        selector,
        text: (fp2 as any).text,
        intent: (fp2 as any).intent,
        enabled: (fp2 as any).enabled
      });
    }
  }
  
  // Generate probable causes (top 1-3 most likely)
  const probableCauses = [];
  
  if (disabled.length > 0) {
    probableCauses.push({
      type: 'disabled_elements',
      message: `${disabled.length} element(s) became disabled`,
      elements: disabled.slice(0, 3),
      severity: 'high'
    });
  }
  
  if (changes.length > 0) {
    const textChanges = changes.filter(c => c.changes.text);
    if (textChanges.length > 0) {
      probableCauses.push({
        type: 'text_changes',
        message: `${textChanges.length} element(s) had text changes`,
        examples: textChanges.slice(0, 2).map((c: any) => ({
          selector: c.selector,
          textChange: c.changes.text
        })),
        severity: 'medium'
      });
    }
  }
  
  if (removed.length > 0) {
    probableCauses.push({
      type: 'missing_elements',
      message: `${removed.length} element(s) were removed`,
      elements: removed.slice(0, 3),
      severity: 'high'
    });
  }
  
  return {
    run1_id: runId,
    run2_id: against,
    summary: {
      total_changes: changes.length + removed.length + added.length,
      changes: changes.length,
      removed: removed.length,
      added: added.length,
      disabled: disabled.length
    },
    changes,
    removed,
    added,
    disabled,
    probable_causes: probableCauses
  };
});

// Get last successful run for comparison
app.get('/runs/:id/last-green', { preHandler: authenticateApiKey }, async (req, reply) => {
  // @ts-ignore
  const runId = req.params.id as string;
  
  // Get current run details
  const { rows: currentRun } = await pool.query(
    'select url, created_at from runs where id = $1 and workspace_id = $2',
    [runId, (req as any).workspaceId]
  );
  
  if (currentRun.length === 0) {
    return reply.code(404).send({ error: 'Run not found' });
  }
  
  // Find last successful run with same URL (before current run)
  const { rows: lastGreen } = await pool.query(`
    select r.id, r.created_at, r.url,
           count(e.id) as event_count,
           count(e.id) filter (where e.kind = 'click') as click_count,
           count(e.id) filter (where e.payload->>'llm' = 'true' or e.payload->'llm' = 'true'::jsonb) as llm_count
    from runs r
    left join events e on r.id = e.run_id
    where r.workspace_id = $1 
      and r.url = $2 
      and r.created_at < $3
      and r.id != $4
    group by r.id, r.created_at, r.url
    order by r.created_at desc
    limit 1
  `, [(req as any).workspaceId, currentRun[0].url, currentRun[0].created_at, runId]);
  
  if (lastGreen.length === 0) {
    return reply.code(404).send({ error: 'No previous successful run found' });
  }
  
  return {
    last_green_run: lastGreen[0],
    current_run: {
      id: runId,
      url: currentRun[0].url,
      created_at: currentRun[0].created_at
    }
  };
});

// Events (with simple correlation join-on-read)
app.get('/runs/:id/events', async (req, reply) => {
  // @ts-ignore
  const runId = req.params.id as string;
  const query = req.query as any;
  const limit = Math.min(parseInt(query.limit) || 1000, 10000);
  const offset = parseInt(query.offset) || 0;
  
  const { rows } = await pool.query(
    'select id, t_ms, kind, payload from events where run_id=$1 order by t_ms asc limit $2 offset $3', 
    [runId, limit, offset]
  );

  // Build correlation: for each click, find last LLM request in prior 5s
  const CORR_WINDOW = 5000;
  const llmEvents = rows.filter((r: any) => r.payload.llm && r.kind === 'network');
  const correlated = rows.map((r: any) => {
    if (r.kind !== 'click') return r;
    const t = r.t_ms;
    let best = null;
    for (let i = llmEvents.length - 1; i >= 0; i--) {
      const e = llmEvents[i];
      if (t - e.t_ms <= CORR_WINDOW && t - e.t_ms >= 0) { best = e; break; }
      if (t - e.t_ms > CORR_WINDOW) break;
    }
    if (best) {
      r.payload = { ...r.payload, correlationServer: { llmEventId: best.id, dt: t - best.t_ms } };
    }
    return r;
  });

  return correlated;
});

// Keyframes endpoints
app.post('/runs/:id/keyframes', async (req, reply) => {
  // @ts-ignore
  const runId = req.params.id as string;
  const { t_ms, kind, data } = req.body as any;
  
  const { rows } = await pool.query(
    'insert into keyframes(run_id, t_ms, kind, data) values($1, $2, $3, $4) returning id',
    [runId, t_ms, kind, JSON.stringify(data)]
  );
  
  return { id: rows[0].id, blob_url: `/runs/${runId}/keyframes/${rows[0].id}` };
});

app.get('/runs/:id/keyframes', async (req, reply) => {
  // @ts-ignore
  const runId = req.params.id as string;
  const { rows } = await pool.query(
    'select id, t_ms, kind, data from keyframes where run_id=$1 order by t_ms asc',
    [runId]
  );
  
  return rows.map((r: any) => ({
    id: r.id,
    t_ms: r.t_ms,
    kind: r.kind,
    blob_url: `/runs/${runId}/keyframes/${r.id}`,
    data: r.data
  }));
});

app.get('/runs/:id/keyframes/:keyframeId', async (req, reply) => {
  // @ts-ignore
  const { id: runId, keyframeId } = req.params;
  const { rows } = await pool.query(
    'select data from keyframes where run_id=$1 and id=$2',
    [runId, keyframeId]
  );
  
  if (rows.length === 0) return reply.code(404).send({ error: 'keyframe not found' });
  
  return rows[0].data;
});

// Analytics endpoints
app.get('/analytics/overview', async () => {
  const { rows: totalRuns } = await pool.query('select count(*) as count from runs');
  const { rows: totalEvents } = await pool.query('select count(*) as count from events');
  const { rows: llmEvents } = await pool.query("select count(*) as count from events where (payload->>'llm' = 'true' or payload->'llm' = 'true'::jsonb)");
  const { rows: clickEvents } = await pool.query("select count(*) as count from events where kind = 'click'");
  const { rows: domEvents } = await pool.query("select count(*) as count from events where kind = 'dom_fp'");
  
  const { rows: recentRuns } = await pool.query(`
    select created_at, url from runs 
    order by created_at desc limit 10
  `);
  
  return {
    totals: {
      runs: parseInt(totalRuns[0].count),
      events: parseInt(totalEvents[0].count),
      llmCalls: parseInt(llmEvents[0].count),
      clicks: parseInt(clickEvents[0].count),
      domFingerprints: parseInt(domEvents[0].count)
    },
    recentRuns: recentRuns
  };
});

app.get('/analytics/providers', async () => {
  const { rows } = await pool.query(`
    select 
      payload->>'provider' as provider,
      count(*) as count,
      avg((payload->>'durMs')::int) as avg_duration,
      count(*) filter (where (payload->'res'->>'status')::int >= 200 and (payload->'res'->>'status')::int < 300) as success_count,
      count(*) filter (where (payload->'res'->>'status')::int >= 400) as error_count
    from events 
    where (payload->>'llm' = 'true' or payload->'llm' = 'true'::jsonb) and payload->>'provider' is not null
    group by payload->>'provider'
    order by count desc
  `);
  
  return rows;
});

app.get('/analytics/performance', async () => {
  const { rows } = await pool.query(`
    select 
      date_trunc('hour', to_timestamp(t_ms/1000)) as hour,
      count(*) as events,
      avg((payload->>'durMs')::int) as avg_duration,
      count(*) filter (where (payload->>'llm' = 'true' or payload->'llm' = 'true'::jsonb)) as llm_calls,
      count(*) filter (where kind = 'click') as clicks
    from events 
    where t_ms > extract(epoch from now() - interval '24 hours') * 1000
    group by date_trunc('hour', to_timestamp(t_ms/1000))
    order by hour desc
  `);
  
  return rows;
});

app.get('/analytics/correlations', async () => {
  const { rows } = await pool.query(`
    select 
      count(*) as total_clicks,
      count(*) filter (where payload->>'correlationId' is not null) as correlated_clicks,
      count(*) filter (where payload->'correlationServer' is not null) as server_correlated_clicks
    from events 
    where kind = 'click'
  `);
  
  return rows[0];
});

// Reports endpoint
app.get('/reports/sessions', async () => {
  const { rows: runs } = await pool.query(`
    select 
      r.id as run_id,
      r.url,
      r.created_at,
      (max(e.t_ms) - min(e.t_ms)) / 1000.0 / 60.0 as duration_minutes,
      count(e.id) as total_events,
      count(e.id) filter (where (e.payload->>'llm' = 'true' or e.payload->'llm' = 'true'::jsonb)) as llm_calls,
      count(e.id) filter (where e.kind = 'click') as clicks,
      count(e.id) filter (where e.payload->>'correlationId' is not null or e.payload->'correlationServer' is not null) as correlated_clicks,
      avg((e.payload->>'durMs')::int) filter (where (e.payload->>'llm' = 'true' or e.payload->'llm' = 'true'::jsonb)) as avg_response_time
    from runs r
    left join events e on r.id = e.run_id
    where e.id is not null
    group by r.id, r.url, r.created_at
    order by r.created_at desc
    limit 20
  `);
  
  const sessions = runs.map((run: any) => ({
    run_id: run.run_id,
    url: run.url || 'Unknown',
    duration_minutes: Math.round((run.duration_minutes || 0) * 10) / 10,
    total_events: parseInt(run.total_events) || 0,
    llm_calls: parseInt(run.llm_calls) || 0,
    clicks: parseInt(run.clicks) || 0,
    correlation_rate: run.clicks > 0 ? Math.round((run.correlated_clicks / run.clicks) * 100 * 10) / 10 : 0,
    avg_response_time: Math.round(run.avg_response_time || 0),
    providers: [] // Will be populated from actual data
  }));
  
  return { sessions };
});

app.listen({ port: PORT, host: '0.0.0.0' });
if (process.env.NODE_ENV !== 'production') {
  console.log(`API on http://localhost:${PORT}`);
}
