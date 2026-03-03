# Memory Dashboard

A web-based dashboard for managing LanceDB vector memories — browse, search, edit memories and manage workspace files.

LanceDB 向量記憶管理儀表板 — 瀏覽、搜尋、編輯向量記憶，以及管理 workspace 檔案。

## Features / 功能

- **Memory Browser / 記憶瀏覽** — Filter by scope / category, full-text search / 以 scope / category 篩選，支援全文搜尋
- **Memory CRUD / 記憶管理** — Create, edit, delete memories with auto-generated embeddings / 新增、編輯、刪除記憶（自動產生 embedding）
- **Workspace Manager / Workspace 管理** — View and edit standard workspace files (MEMORY.md, IDENTITY.md, etc.) / 檢視和編輯 workspace 標準檔案
- **Stats Dashboard / 統計儀表板** — Memory counts by scope and category / 各 scope / category 的記憶數量統計
- **Demo Mode** — Built-in sample data, no external dependencies required / 內建假資料，無需外部依賴即可體驗完整功能

## Quick Start — Demo Mode / 快速開始

No LanceDB or OpenAI API key needed. Try the full UI instantly:

不需要 LanceDB 或 OpenAI API key，直接體驗完整 UI：

```bash
npm install
npm run build
DEMO_MODE=true npm run server
# → http://localhost:3001
```

### Docker (Demo Mode)

```bash
docker build -t memory-dashboard .
docker run -p 3001:3001 -e DEMO_MODE=true memory-dashboard
```

## Production Usage / 正式使用

Connect to a real LanceDB database:

連接真實 LanceDB 資料庫：

```bash
npm install
npm run build
OPENAI_API_KEY=your-key-here \
  MEMORY_DB_PATH=/path/to/lancedb \
  WORKSPACE_DIR=/path/to/workspaces \
  npm run server
```

### Docker (Production / 正式)

```bash
docker build -t memory-dashboard .
docker run -p 3001:3001 \
  -v /path/to/workspaces:/data/workspaces \
  -v /path/to/memory-db:/data/memory-db \
  -e OPENAI_API_KEY=your-key-here \
  memory-dashboard
```

## Environment Variables / 環境變數

| Variable / 變數 | Default / 預設值 | Description / 說明 |
|---|---|---|
| `DEMO_MODE` | `false` | Enable demo mode (in-memory sample data) / 啟用 demo 模式（in-memory 假資料） |
| `PORT` | `3001` | Server listen port / 伺服器監聽 port |
| `DIST_DIR` | `../dist` | Frontend static files directory / 前端靜態檔案目錄 |
| `WORKSPACE_DIR` | `/data/workspaces` | Workspace root directory / Workspace 根目錄 |
| `MEMORY_DB_PATH` | `/data/memory-db` | LanceDB database path / LanceDB 資料庫路徑 |
| `MEMORY_TABLE_NAME` | `memories` | LanceDB table name / LanceDB table 名稱 |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |
| `OPENAI_API_KEY` | — | OpenAI API key (required in non-demo mode / 非 demo 模式必填) |

## Tech Stack / 技術架構

- **Frontend / 前端**: React 19 + Vite 6 + TypeScript
- **Backend / 後端**: Node.js native HTTP server / Node.js 原生 HTTP server
- **Database / 資料庫**: LanceDB (vector search / 向量搜尋)
- **Embeddings**: OpenAI `text-embedding-3-small`

## Development / 開發

```bash
npm run dev    # Frontend dev server (proxy /api → localhost:3001)
npm run build  # Build frontend + compile server
```

## License

MIT
