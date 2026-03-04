import type { IncomingMessage, ServerResponse } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { getDemoSkills, deleteDemoSkill, moveDemoSkill, copyDemoSkill } from './demo-store.js';

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || '/data/workspaces';
const SKILLS_DIR = process.env.SKILLS_DIR || join(homedir(), '.claude', 'skills');

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

interface SkillInfo {
  name: string;
  description: string;
  homepage?: string;
  version?: string;
  files: { name: string; size: number }[];
  totalSize: number;
}

interface SkillOwner {
  name: string;
  label: string;
  skills: SkillInfo[];
}

/** Parse YAML frontmatter from SKILL.md (simple key: "value" pairs) */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+)\s*:\s*"?([^"]*)"?\s*$/);
    if (m) result[m[1]] = m[2].trim();
  }
  return result;
}

/** Recursively list files in a directory with sizes */
async function listFiles(dir: string): Promise<{ name: string; size: number }[]> {
  const files: { name: string; size: number }[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isFile()) {
        const s = await stat(fullPath);
        files.push({ name: entry.name, size: s.size });
      } else if (entry.isDirectory()) {
        const subFiles = await listFiles(fullPath);
        for (const sf of subFiles) {
          files.push({ name: `${entry.name}/${sf.name}`, size: sf.size });
        }
      }
    }
  } catch { /* directory doesn't exist or not readable */ }
  return files;
}

/** Scan a single skill directory and return SkillInfo */
async function scanSkill(skillDir: string, dirName: string): Promise<SkillInfo | null> {
  try {
    const s = await stat(skillDir);
    if (!s.isDirectory()) return null;
  } catch {
    return null;
  }

  let name = dirName;
  let description = '';
  let homepage: string | undefined;
  let version: string | undefined;

  // Parse SKILL.md frontmatter
  try {
    const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
    const fm = parseFrontmatter(content);
    if (fm.name) name = fm.name;
    if (fm.description) description = fm.description;
    if (fm.homepage) homepage = fm.homepage;
  } catch { /* no SKILL.md */ }

  // Read _meta.json for version
  try {
    const meta = JSON.parse(await readFile(join(skillDir, '_meta.json'), 'utf-8'));
    if (meta.version) version = meta.version;
  } catch { /* no _meta.json */ }

  const files = await listFiles(skillDir);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return { name, description, homepage, version, files, totalSize };
}

/** Scan a skills root directory and return all skills */
async function scanSkillsDir(dir: string): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skill = await scanSkill(join(dir, entry.name), entry.name);
      if (skill) skills.push(skill);
    }
  } catch { /* directory doesn't exist */ }
  return skills;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

/** Handle /api/skills */
export async function handleSkillsApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // GET /api/skills — list all skills
  if (url.pathname === '/api/skills' && req.method === 'GET') {
    if (DEMO_MODE) {
      json(res, getDemoSkills());
      return true;
    }

    const owners: SkillOwner[] = [];
    const globalSkills = await scanSkillsDir(SKILLS_DIR);
    if (globalSkills.length > 0) owners.push({ name: 'global', label: 'Global', skills: globalSkills });
    const sharedSkills = await scanSkillsDir(join(WORKSPACE_DIR, 'skills'));
    if (sharedSkills.length > 0) owners.push({ name: 'shared', label: 'Shared', skills: sharedSkills });
    try {
      const entries = await readdir(WORKSPACE_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.startsWith('workspace-')) continue;
        const agentSkills = await scanSkillsDir(join(WORKSPACE_DIR, entry.name, 'skills'));
        if (agentSkills.length > 0) {
          const agentName = entry.name.replace('workspace-', '');
          owners.push({ name: entry.name, label: agentName, skills: agentSkills });
        }
      }
    } catch { /* WORKSPACE_DIR doesn't exist */ }
    const totalSkills = owners.reduce((sum, o) => sum + o.skills.length, 0);
    json(res, { owners, totalSkills });
    return true;
  }

  // DELETE /api/skills/:owner/:skillName
  const deleteMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/([^/]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    if (DEMO_MODE) {
      const [, owner, skillName] = deleteMatch.map(decodeURIComponent);
      const ok = deleteDemoSkill(owner, skillName);
      if (!ok) { json(res, { error: 'skill not found' }, 404); return true; }
      json(res, { ok: true });
      return true;
    }
    json(res, { error: 'not supported' }, 501);
    return true;
  }

  // POST /api/skills/move
  if (url.pathname === '/api/skills/move' && req.method === 'POST') {
    if (DEMO_MODE) {
      const body = JSON.parse(await readBody(req));
      const err = moveDemoSkill(body.from?.owner, body.from?.skillName, body.to?.owner);
      if (err) { json(res, { error: err }, 400); return true; }
      json(res, { ok: true });
      return true;
    }
    json(res, { error: 'not supported' }, 501);
    return true;
  }

  // POST /api/skills/copy
  if (url.pathname === '/api/skills/copy' && req.method === 'POST') {
    if (DEMO_MODE) {
      const body = JSON.parse(await readBody(req));
      const err = copyDemoSkill(body.from?.owner, body.from?.skillName, body.to?.owner);
      if (err) { json(res, { error: err }, 400); return true; }
      json(res, { ok: true });
      return true;
    }
    json(res, { error: 'not supported' }, 501);
    return true;
  }

  return false;
}
