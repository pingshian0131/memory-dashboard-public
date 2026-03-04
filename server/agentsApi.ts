import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/data/openclaw';

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/** Extract display name from IDENTITY.md first line like "- **Name:** 工匠凱金（Kaijin）" */
function parseDisplayName(content: string): string {
  const match = content.match(/\*\*Name:\*\*\s*(.+)/);
  if (!match) return '';
  return match[1].trim();
}

export async function handleAgentsApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname !== '/api/agents' || req.method !== 'GET') return false;

  if (DEMO_MODE) {
    const { DEMO_AGENTS, DEMO_AGENTS_DEFAULTS } = await import('./demo-data.js');
    json(res, { agents: DEMO_AGENTS, defaults: DEMO_AGENTS_DEFAULTS });
    return true;
  }

  try {
    const config = JSON.parse(await readFile(join(OPENCLAW_DIR, 'openclaw.json'), 'utf-8'));
    const agentsList: any[] = config.agents?.list ?? [];
    const defaults = config.agents?.defaults ?? {};
    const bindings: any[] = config.bindings ?? [];
    const scopeDefs: Record<string, { description?: string }> =
      config.plugins?.entries?.['memory-lancedb-pro']?.config?.scopes?.definitions ?? {};

    const agents = await Promise.all(agentsList.map(async (agent: any) => {
      const id: string = agent.id;

      let displayName = '';
      const wsDir = id === 'main' ? 'workspace' : `workspace-${id}`;
      try {
        const identity = await readFile(join(OPENCLAW_DIR, wsDir, 'IDENTITY.md'), 'utf-8');
        displayName = parseDisplayName(identity);
      } catch { /* no IDENTITY.md */ }

      const scopeKey = `agent:${id}`;
      const description = scopeDefs[scopeKey]?.description ?? '';

      const agentBindings = bindings
        .filter((b: any) => b.agentId === id)
        .map((b: any) => ({ channel: b.match?.channel, accountId: b.match?.accountId }));

      return {
        id,
        name: agent.name ?? id,
        displayName,
        model: agent.model ?? defaults.model?.primary ?? '',
        workspace: wsDir,
        description,
        subagents: agent.subagents?.allowAgents ?? [],
        bindings: agentBindings,
      };
    }));

    json(res, {
      agents,
      defaults: {
        model: defaults.model ?? {},
        maxConcurrent: defaults.maxConcurrent ?? 0,
      },
    });
  } catch (e: any) {
    json(res, { error: e.message ?? 'failed to read agents config' }, 500);
  }

  return true;
}
