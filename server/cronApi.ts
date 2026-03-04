import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/data/openclaw';

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export async function handleCronApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname !== '/api/cron-jobs' || req.method !== 'GET') return false;

  if (DEMO_MODE) {
    const { DEMO_CRON_JOBS } = await import('./demo-data.js');
    json(res, { jobs: DEMO_CRON_JOBS });
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
