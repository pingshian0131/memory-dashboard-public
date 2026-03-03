import type { IncomingMessage, ServerResponse } from 'node:http';

const DEMO_MODE = process.env.DEMO_MODE === 'true';

const { listMemories, getMemory, createMemory, updateMemory, deleteMemory, getScopes, getStats } = DEMO_MODE
  ? await import('./demo-store.js')
  : await import('./lancedb.js');

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf-8');
}

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function err(res: ServerResponse, message: string, status = 400) {
  json(res, { error: message }, status);
}

/** Handle /api/memories/*, /api/scopes, /api/stats */
export async function handleMemoryApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;
  const method = req.method ?? 'GET';

  // GET /api/scopes
  if (path === '/api/scopes' && method === 'GET') {
    const scopes = await getScopes();
    json(res, scopes);
    return true;
  }

  // GET /api/stats
  if (path === '/api/stats' && method === 'GET') {
    const stats = await getStats();
    json(res, stats);
    return true;
  }

  // GET /api/memories
  if (path === '/api/memories' && method === 'GET') {
    const scope = url.searchParams.get('scope') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
    const result = await listMemories({ scope, category, search, limit, offset });
    json(res, result);
    return true;
  }

  // POST /api/memories
  if (path === '/api/memories' && method === 'POST') {
    const body = JSON.parse(await readBody(req));
    if (!body.text || !body.category || !body.scope) {
      err(res, 'text, category, scope are required');
      return true;
    }
    const memory = await createMemory({
      text: body.text,
      category: body.category,
      scope: body.scope,
      importance: body.importance ?? 0.5,
      metadata: body.metadata,
    });
    json(res, memory, 201);
    return true;
  }

  // /api/memories/:id
  const idMatch = path.match(/^\/api\/memories\/([^/]+)$/);
  if (idMatch) {
    const id = decodeURIComponent(idMatch[1]);

    if (method === 'GET') {
      const memory = await getMemory(id);
      if (!memory) { err(res, 'not found', 404); return true; }
      json(res, memory);
      return true;
    }

    if (method === 'PUT') {
      const body = JSON.parse(await readBody(req));
      const memory = await updateMemory(id, body);
      if (!memory) { err(res, 'not found', 404); return true; }
      json(res, memory);
      return true;
    }

    if (method === 'DELETE') {
      await deleteMemory(id);
      json(res, { ok: true });
      return true;
    }
  }

  return false;
}
