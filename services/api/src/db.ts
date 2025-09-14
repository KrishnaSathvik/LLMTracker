import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL || 'postgres://afr:afr@localhost:5432/afr';

export const pool = new Pool({
  connectionString: dbUrl,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10)
});

export async function initDb() {
  // Workspaces table
  await pool.query(`
  create table if not exists workspaces (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz default now()
  );`);

  // API keys table
  await pool.query(`
  create table if not exists api_keys (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references workspaces(id) on delete cascade,
    key text not null unique,
    name text not null default 'Default Key',
    created_at timestamptz default now()
  );`);

  await pool.query(`
  create index if not exists idx_api_keys_workspace_id on api_keys(workspace_id);
  create index if not exists idx_api_keys_key on api_keys(key);
  `);

  // Create runs table
  await pool.query(`
  create table if not exists runs (
    id uuid primary key,
    created_at timestamptz not null default now(),
    url text,
    meta jsonb default '{}'::jsonb,
    workspace_id uuid references workspaces(id) on delete cascade
  );`);

  await pool.query(`
  create index if not exists idx_runs_workspace_id on runs(workspace_id);
  create index if not exists idx_runs_created_at on runs(created_at desc);
  `);

  await pool.query(`
  create table if not exists events (
    id bigserial primary key,
    run_id uuid not null references runs(id) on delete cascade,
    t_ms bigint not null,
    kind text not null,
    payload jsonb not null
  );
  `);

  await pool.query(`
  create index if not exists events_run_time on events(run_id, t_ms);
  `);

  await pool.query(`
  create table if not exists keyframes (
    id bigserial primary key,
    run_id uuid not null references runs(id) on delete cascade,
    t_ms bigint not null,
    kind text not null,
    blob_url text,
    data jsonb
  );
  `);

  await pool.query(`
  create index if not exists keyframes_run_time on keyframes(run_id, t_ms);
  `);

  await pool.query(`
  create table if not exists retention_policies (
    id bigserial primary key,
    workspace_id text,
    retention_days integer not null default 30,
    created_at timestamptz not null default now()
  );
  `);

  // Create default workspace for existing data
  const { rows: workspaces } = await pool.query('select id from workspaces limit 1');
  if (workspaces.length === 0) {
    const { rows: [defaultWorkspace] } = await pool.query(
      'insert into workspaces (name) values ($1) returning id',
      ['Default Workspace']
    );
    
    // Migrate existing runs to default workspace
    await pool.query(
      'update runs set workspace_id = $1 where workspace_id is null',
      [defaultWorkspace.id]
    );
  }

  console.log('Database initialized with workspace support');
}
