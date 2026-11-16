import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { login, logout, requireDemoSession, sessionStatus } from './auth';
import {
  INITIAL_APPROVALS,
  INITIAL_COURSES,
  INITIAL_DEPARTMENTS,
  INITIAL_MESSAGES,
  INITIAL_STUDENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_UNITS,
} from '../src/data/mockData';
import { DemoWorkspaceState } from '../src/types/academic';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');
}

const pool = new Pool({ connectionString: databaseUrl });
const workspaceIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const workspaceArrays: (keyof DemoWorkspaceState)[] = [
  'departments',
  'approvals',
  'courses',
  'units',
  'submissions',
  'students',
  'messages',
];

const seedState: DemoWorkspaceState = {
  departments: INITIAL_DEPARTMENTS,
  approvals: INITIAL_APPROVALS,
  courses: INITIAL_COURSES,
  units: INITIAL_UNITS,
  submissions: INITIAL_SUBMISSIONS,
  students: INITIAL_STUDENTS,
  messages: INITIAL_MESSAGES,
};

app.use(express.json({ limit: '1mb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.post('/api/auth/login', login);
app.get('/api/auth/session', sessionStatus);
app.post('/api/auth/logout', logout);

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/demo/:workspaceId', requireDemoSession);

app.get('/api/demo/:workspaceId', async (req, res, next) => {
  const { workspaceId } = req.params;
  if (!isWorkspaceId(workspaceId)) {
    res.status(400).json({ error: 'Invalid demo workspace identifier.' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO demo_workspaces (workspace_id, state)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (workspace_id) DO NOTHING`,
      [workspaceId, JSON.stringify(seedState)]
    );
    const workspace = await pool.query<{ state: DemoWorkspaceState }>(
      'SELECT state FROM demo_workspaces WHERE workspace_id = $1',
      [workspaceId]
    );

    res.json(workspace.rows[0].state);
  } catch (error) {
    next(error);
  }
});

app.put('/api/demo/:workspaceId', async (req, res, next) => {
  const { workspaceId } = req.params;
  if (!isWorkspaceId(workspaceId)) {
    res.status(400).json({ error: 'Invalid demo workspace identifier.' });
    return;
  }
  if (!isDemoWorkspaceState(req.body)) {
    res.status(400).json({ error: 'Workspace data is missing required collections.' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO demo_workspaces (workspace_id, state)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (workspace_id) DO UPDATE
       SET state = EXCLUDED.state, updated_at = NOW()`,
      [workspaceId, JSON.stringify(req.body)]
    );
    res.json({ saved: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/demo/:workspaceId/reset', async (req, res, next) => {
  const { workspaceId } = req.params;
  if (!isWorkspaceId(workspaceId)) {
    res.status(400).json({ error: 'Invalid demo workspace identifier.' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO demo_workspaces (workspace_id, state)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (workspace_id) DO UPDATE
       SET state = EXCLUDED.state, updated_at = NOW()`,
      [workspaceId, JSON.stringify(seedState)]
    );
    res.json(seedState);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Academic Nexus API request failed.', error);
  res.status(500).json({ error: 'The server could not complete this request.' });
});

async function start() {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const schema = await readFile(path.join(currentDirectory, 'schema.sql'), 'utf8');
  await pool.query(schema);
  await pool.query('SELECT 1');

  app.listen(port, '127.0.0.1', () => {
    console.log(`Academic Nexus API listening at http://127.0.0.1:${port}`);
  });
}

function isWorkspaceId(value: string) {
  return workspaceIdPattern.test(value);
}

function isDemoWorkspaceState(value: unknown): value is DemoWorkspaceState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  return workspaceArrays.every(
    (key) =>
      Array.isArray(state[key]) &&
      (state[key] as unknown[]).every(
        (item) =>
          item !== null &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          typeof (item as { id?: unknown }).id === 'string'
      )
  );
}

start().catch(async (error: unknown) => {
  console.error('Could not start Academic Nexus. Check that PostgreSQL is running and DATABASE_URL is correct.', error);
  await pool.end();
  process.exitCode = 1;
});
