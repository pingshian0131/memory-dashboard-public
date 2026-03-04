# Agents Dashboard

OpenClaw agent 管理儀表板，提供 Web 介面管理記憶、agents、排程任務與 skills。

## 功能

### MEMORY
- **記憶瀏覽** — 以 scope / category 篩選，支援全文搜尋
- **記憶管理** — 新增、編輯、刪除記憶（自動產生 embedding）
- **Workspace 管理** — 檢視和編輯 workspace 標準檔案（MEMORY.md, IDENTITY.md 等）
- **統計儀表板** — 各 scope / category 的記憶數量統計

### AGENTS
- **Agent 總覽** — 列出所有 agents，顯示 model、職責描述、subagents 數量
- **Agent 詳情** — model、workspace、subagents 列表、Discord/Telegram channel bindings

### CRON JOBS
- **排程任務列表** — 顯示所有 cron jobs，含排程表達式、啟用狀態、執行歷史
- **狀態監控** — 上次執行結果、耗時、下次執行時間、連續錯誤數
- **篩選** — 按 agent / 狀態（enabled/disabled/errors）篩選

### SKILLS
- **Skills 瀏覽** — 瀏覽 global / shared / agent 三層級 skills

### 側邊欄
- **統一導航** — 左側可收合的 MEMORY / AGENTS / CRON JOBS / SKILLS 四大區塊

## 快速開始

### 前置需求

- Node.js 22+
- LanceDB 資料庫（位於 `MEMORY_DB_PATH`）
- OpenAI API key

### 安裝與執行

```bash
npm install

# 開發模式（前端 hot reload + 後端需另行啟動）
npm run dev

# 建置
npm run build

# 啟動生產伺服器
OPENAI_API_KEY=sk-xxx npm run server
```

### Docker

```bash
docker build -t agents-dashboard .
docker run -p 3001:3001 \
  -v /path/to/openclaw:/data/openclaw \
  -e OPENAI_API_KEY=sk-xxx \
  agents-dashboard
```

## 環境變數

| 變數 | 預設值 | 說明 |
|---|---|---|
| `PORT` | `3001` | 伺服器監聯 port |
| `DIST_DIR` | `../dist` | 前端靜態檔案目錄 |
| `OPENCLAW_DIR` | `/data/openclaw` | OpenClaw workspace 根目錄 |
| `MEMORY_DB_PATH` | `/data/openclaw/memory/lancedb-pro` | LanceDB 資料庫路徑 |
| `OPENAI_API_KEY` | — | OpenAI API key（必填） |

## 技術架構

- **前端**: React 19 + Vite 6 + TypeScript
- **後端**: Node.js 原生 HTTP server
- **資料庫**: LanceDB（向量搜尋）
- **Embeddings**: OpenAI `text-embedding-3-small`
