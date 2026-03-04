#!/usr/bin/env node

import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

// --help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  Usage: agents-dashboard [options]

  Options:
    --port <number>          Server port (default: 3001)
    --openclaw-dir <path>    OpenClaw data directory (default: ~/.openclaw-personal)
    --demo                   Run with built-in sample data
    -h, --help               Show this help
  `);
  process.exit(0);
}

function getArg(name) {
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
}

// Resolve OpenClaw directory
const defaultOpenclawDir = join(homedir(), '.openclaw-personal');
const openclawDir = getArg('--openclaw-dir') || process.env.OPENCLAW_DIR || defaultOpenclawDir;
const isDemo = args.includes('--demo') || process.env.DEMO_MODE === 'true';
const port = getArg('--port') || process.env.PORT || '3001';

// Set env vars before importing server
process.env.PORT = port;
process.env.DIST_DIR = join(__dirname, '..', 'dist');
process.env.OPENCLAW_DIR = openclawDir;
process.env.WORKSPACE_DIR = process.env.WORKSPACE_DIR || openclawDir;
process.env.MEMORY_DB_PATH = process.env.MEMORY_DB_PATH || join(openclawDir, 'memory', 'lancedb-pro');

if (isDemo) {
  process.env.DEMO_MODE = 'true';
}

// Startup info
if (isDemo) {
  console.log('Mode: demo (built-in sample data)');
} else if (existsSync(join(openclawDir, 'openclaw.json'))) {
  console.log(`OpenClaw: ${openclawDir}`);
} else {
  console.log(`Warning: ${openclawDir} not found. Use --demo for sample data or --openclaw-dir to specify path.`);
}

// Start server
await import('../dist-server/server/standalone.js');
