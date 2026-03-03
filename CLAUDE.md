# Memory Dashboard

LanceDB 向量記憶管理儀表板 — 瀏覽、搜尋、編輯向量記憶，以及管理 workspace 檔案。

## 架構

- **前端**: React 19 + Vite 6 + TypeScript，inline styles（深色終端風格）
- **後端**: Node.js 原生 HTTP server（無框架），同時提供 API 與靜態檔案
- **資料庫**: LanceDB 向量資料庫（demo mode 使用 in-memory store）
- **Embeddings**: OpenAI `text-embedding-3-small`

## 目錄結構

```
src/                  # React 前端
  main.tsx            # 入口
  App.tsx             # 路由（lancedb / workspaces / stats）
  api.ts              # 前端 API client
  types.ts            # 共用型別
  theme.ts            # 深色主題 + CSS 預設樣式
  components/         # UI 元件（Header, Layout, MemoryCard, MemoryForm, Pagination, SearchBar）
  pages/              # 頁面（LanceDBPage, WorkspacePage, StatsPage）
server/               # Node.js 後端
  standalone.ts       # HTTP server 入口，靜態檔案 + SPA fallback
  memoryApi.ts        # /api/memories, /api/scopes, /api/stats
  lancedb.ts          # LanceDB 連線與 CRUD + embedding
  workspaceApi.ts     # /api/workspaces — workspace 檔案讀寫
  demo-data.ts        # Demo 假資料（memories + workspace 檔案）
  demo-store.ts       # In-memory CRUD store（DEMO_MODE 使用）
```

## 常用指令

```bash
npm run dev           # Vite dev server（前端 proxy /api → localhost:3001）
npm run build         # 建置前端 + 編譯 server（dist/ + dist-server/）
npm run server        # 啟動生產伺服器（port 3001）
npm run preview       # Vite preview

# Demo mode（不需要 LanceDB 和 OpenAI API key）
DEMO_MODE=true npm run server
```

## 環境變數

| 變數 | 預設值 | 說明 |
|---|---|---|
| `DEMO_MODE` | `false` | 啟用 demo 模式（in-memory 假資料，不需要 LanceDB / OpenAI） |
| `PORT` | `3001` | 伺服器監聽 port |
| `DIST_DIR` | `../dist`（相對於 server） | 前端靜態檔案目錄 |
| `WORKSPACE_DIR` | `/data/workspaces` | Workspace 根目錄 |
| `MEMORY_DB_PATH` | `/data/memory-db` | LanceDB 資料庫路徑 |
| `OPENAI_API_KEY` | —（非 demo 模式必填） | OpenAI API key，用於 embedding |

## API 路由

- `GET/POST /api/memories` — 列出 / 新增記憶
- `GET/PUT/DELETE /api/memories/:id` — 單筆記憶 CRUD
- `GET /api/scopes` — 列出所有 scope 及數量
- `GET /api/stats` — 統計（by scope / by category）
- `GET /api/workspaces` — 列出所有 workspace 及其檔案
- `GET/PUT /api/workspaces/:name/:file` — 讀寫 workspace 標準檔案
- `GET /api/workspaces/:name/memory/:file` — 讀取 workspace memory 子目錄檔案（唯讀）

## 重要慣例

- Workspace 標準檔案：`MEMORY.md`, `IDENTITY.md`, `SOUL.md`, `USER.md`, `AGENTS.md`, `TOOLS.md`, `HEARTBEAT.md`
- Workspace 名稱格式：`workspace` 或 `workspace-xxx`（防 path traversal）
- 前端使用 inline styles，不使用 CSS 檔案；主題定義在 `src/theme.ts`
- 後端使用 Node.js 原生 `http` 模組，不使用 Express/Fastify
