import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getDemoCronJobs, updateDemoCronJob } from './demo-store.js';

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/data/openclaw';

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export async function handleCronApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // GET /api/cron-jobs
  if (url.pathname === '/api/cron-jobs' && req.method === 'GET') {
    if (DEMO_MODE) {
      json(res, { jobs: getDemoCronJobs() });
      return true;
    }

    try {
      const data = JSON.parse(await readFile(join(OPENCLAW_DIR, 'cron', 'jobs.json'), 'utf-8'));
      const rawJobs: any[] = data.jobs ?? [];
      const jobs = rawJobs.map((job: any) => ({
        id: job.id,
        agentId: job.agentId,
        name: job.name,
        description: job.description ?? '',
        enabled: job.enabled ?? false,
        payload: job.payload,
        sessionTarget: job.sessionTarget,
        wakeMode: job.wakeMode,
        schedule: {
          kind: job.schedule?.kind,
          expr: job.schedule?.expr,
          everyMs: job.schedule?.everyMs,
          at: job.schedule?.at,
          tz: job.schedule?.tz,
        },
        state: {
          lastRunAtMs: job.state?.lastRunAtMs,
          lastRunStatus: job.state?.lastRunStatus,
          lastDurationMs: job.state?.lastDurationMs,
          nextRunAtMs: job.state?.nextRunAtMs,
          consecutiveErrors: job.state?.consecutiveErrors ?? 0,
          lastError: job.state?.lastError,
        },
        delivery: job.delivery ? {
          mode: job.delivery.mode,
          channel: job.delivery.channel,
          to: job.delivery.to,
        } : undefined,
      }));
      json(res, { jobs });
    } catch (e: any) {
      json(res, { error: e.message ?? 'failed to read cron jobs' }, 500);
    }
    return true;
  }

  // PUT /api/cron-jobs/:id
  const putMatch = url.pathname.match(/^\/api\/cron-jobs\/([a-f0-9-]+)$/);
  if (putMatch && req.method === 'PUT') {
    const jobId = putMatch[1];
    const body = JSON.parse(await readBody(req));

    if (DEMO_MODE) {
      const job = updateDemoCronJob(jobId, body);
      if (!job) { json(res, { error: 'job not found' }, 404); return true; }
      json(res, { ok: true, job });
      return true;
    }

    // Non-demo: not supported in public build
    json(res, { error: 'not supported' }, 501);
    return true;
  }

  return false;
}
