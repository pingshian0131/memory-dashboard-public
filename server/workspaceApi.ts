import type { IncomingMessage, ServerResponse } from 'node:http';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  getDemoWorkspaceNames,
  getDemoWorkspaceInfo,
  getDemoWorkspaceFile,
  saveDemoWorkspaceFile,
  getDemoWorkspaceMemoryFile,
} from './demo-store.js';

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/data/workspaces';
const STANDARD_FILES = ['MEMORY.md', 'IDENTITY.md', 'SOUL.md', 'USER.md', 'AGENTS.md', 'TOOLS.md', 'HEARTBEAT.md'];

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function err(res: ServerResponse, message: string, status = 400) {
  json(res, { error: message }, status);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf-8');
}

/** Validate workspace name to prevent path traversal */
function isValidName(name: string): boolean {
  return /^workspace(-[\w-]+)?$/.test(name) && !name.includes('..');
}

/** Get list of workspace directories */
async function getWorkspaceNames(): Promise<string[]> {
  if (DEMO_MODE) return getDemoWorkspaceNames();
  const entries = await readdir(WORKSPACE_DIR, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && e.name.startsWith('workspace'))
    .map(e => e.name)
    .sort();
}

/** Get workspace info with file listing */
async function getWorkspaceInfo(name: string) {
  if (DEMO_MODE) return getDemoWorkspaceInfo(name);
  const dir = join(WORKSPACE_DIR, name);
  const files: { name: string; size: number; modified: string }[] = [];

  for (const f of STANDARD_FILES) {
    try {
      const s = await stat(join(dir, f));
      files.push({ name: f, size: s.size, modified: s.mtime.toISOString() });
    } catch { /* file doesn't exist */ }
  }

  // Check memory/ subdirectory
  const memDir = join(dir, 'memory');
  let memoryFiles: { name: string; size: number; modified: string }[] = [];
  try {
    const memEntries = await readdir(memDir, { withFileTypes: true });
    for (const e of memEntries) {
      if (e.isFile()) {
        const s = await stat(join(memDir, e.name));
        memoryFiles.push({ name: e.name, size: s.size, modified: s.mtime.toISOString() });
      }
    }
    memoryFiles.sort((a, b) => a.name.localeCompare(b.name));
  } catch { /* no memory dir */ }

  return { name, files, memoryFiles };
}

/** Handle /api/workspaces/* */
export async function handleWorkspaceApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;
  const method = req.method ?? 'GET';

  // GET /api/workspaces
  if (path === '/api/workspaces' && method === 'GET') {
    const names = await getWorkspaceNames();
    const workspaces = (await Promise.all(names.map(getWorkspaceInfo))).filter(Boolean);
    json(res, workspaces);
    return true;
  }

  // GET /api/workspaces/:name/memory
  const memListMatch = path.match(/^\/api\/workspaces\/([\w-]+)\/memory$/);
  if (memListMatch && method === 'GET') {
    const name = memListMatch[1];
    if (!isValidName(name)) { err(res, 'invalid workspace name', 400); return true; }

    if (DEMO_MODE) {
      const info = getDemoWorkspaceInfo(name);
      json(res, info?.memoryFiles ?? []);
      return true;
    }

    const memDir = join(WORKSPACE_DIR, name, 'memory');
    try {
      const entries = await readdir(memDir, { withFileTypes: true });
      const files = [];
      for (const e of entries) {
        if (e.isFile()) {
          const s = await stat(join(memDir, e.name));
          files.push({ name: e.name, size: s.size, modified: s.mtime.toISOString() });
        }
      }
      json(res, files);
    } catch {
      json(res, []);
    }
    return true;
  }

  // GET /api/workspaces/:name/memory/:file
  const memFileMatch = path.match(/^\/api\/workspaces\/([\w-]+)\/memory\/(.+)$/);
  if (memFileMatch) {
    const name = memFileMatch[1];
    const fileName = decodeURIComponent(memFileMatch[2]);
    if (!isValidName(name) || fileName.includes('..') || fileName.includes('/')) {
      err(res, 'invalid path', 400);
      return true;
    }

    if (DEMO_MODE) {
      if (method === 'GET') {
        const content = getDemoWorkspaceMemoryFile(name, fileName);
        if (content === null) { err(res, 'file not found', 404); return true; }
        json(res, { name: fileName, content });
        return true;
      }
      return false;
    }

    const filePath = resolve(join(WORKSPACE_DIR, name, 'memory', fileName));
    if (!filePath.startsWith(resolve(join(WORKSPACE_DIR, name, 'memory')))) {
      err(res, 'path traversal detected', 403);
      return true;
    }

    if (method === 'GET') {
      try {
        const content = await readFile(filePath, 'utf-8');
        json(res, { name: fileName, content });
      } catch {
        err(res, 'file not found', 404);
      }
      return true;
    }
    return false;
  }

  // GET/PUT /api/workspaces/:name/:file
  const fileMatch = path.match(/^\/api\/workspaces\/([\w-]+)\/(.+)$/);
  if (fileMatch) {
    const name = fileMatch[1];
    const fileName = decodeURIComponent(fileMatch[2]);
    if (!isValidName(name)) { err(res, 'invalid workspace name', 400); return true; }
    if (!STANDARD_FILES.includes(fileName)) { err(res, 'file not in standard set', 400); return true; }

    if (DEMO_MODE) {
      if (method === 'GET') {
        const content = getDemoWorkspaceFile(name, fileName);
        if (content === null) { err(res, 'file not found', 404); return true; }
        json(res, { name: fileName, content });
        return true;
      }
      if (method === 'PUT') {
        const body = JSON.parse(await readBody(req));
        if (typeof body.content !== 'string') { err(res, 'content required'); return true; }
        saveDemoWorkspaceFile(name, fileName, body.content);
        json(res, { ok: true });
        return true;
      }
    }

    const filePath = resolve(join(WORKSPACE_DIR, name, fileName));
    if (!filePath.startsWith(resolve(join(WORKSPACE_DIR, name)))) {
      err(res, 'path traversal detected', 403);
      return true;
    }

    if (method === 'GET') {
      try {
        const content = await readFile(filePath, 'utf-8');
        json(res, { name: fileName, content });
      } catch {
        err(res, 'file not found', 404);
      }
      return true;
    }

    if (method === 'PUT') {
      const body = JSON.parse(await readBody(req));
      if (typeof body.content !== 'string') { err(res, 'content required'); return true; }
      await writeFile(filePath, body.content, 'utf-8');
      json(res, { ok: true });
      return true;
    }
  }

  return false;
}
