# Agents Dashboard

Dashboard for [OpenClaw](https://github.com/open-claw/openclaw) agents — memory, agents, cron jobs, skills.

**[Live Demo](https://demo-agents-dashboard.simple-web.cc/)**

## Install

```
npx @pingshian/agents-terminal-dashboard
```

Requires Node.js 20+. Auto-detects `~/.openclaw-personal`.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `3001` | Server port |
| `--openclaw-dir` | `~/.openclaw-personal` | OpenClaw data directory |
| `--demo` | | Run with sample data (no OpenClaw needed) |

## Docker

```
docker run -p 3001:3001 -v ~/.openclaw-personal:/data/openclaw ghcr.io/pingshian0131/agents-dashboard-public
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `OPENCLAW_DIR` | `/data/openclaw` | OpenClaw data directory |
| `WORKSPACE_DIR` | `= OPENCLAW_DIR` | Workspace root |
| `MEMORY_DB_PATH` | `= OPENCLAW_DIR/memory/lancedb-pro` | LanceDB path |
| `OPENAI_API_KEY` | — | Required for memory search/write |
| `DEMO_MODE` | `false` | Use built-in sample data |

## License

MIT
