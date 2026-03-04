export interface Memory {
  id: string;
  text: string;
  category: string;
  scope: string;
  importance: number;
  timestamp: number;
  metadata: string;
}

export interface MemoryInput {
  text: string;
  category: string;
  scope: string;
  importance: number;
  metadata?: string;
}

export interface ScopeInfo {
  scope: string;
  count: number;
}

export interface Stats {
  total: number;
  byScope: ScopeInfo[];
  byCategory: { category: string; count: number }[];
}

export interface WorkspaceFile {
  name: string;
  size: number;
  modified: string;
}

export interface Workspace {
  name: string;
  files: WorkspaceFile[];
  memoryFiles: WorkspaceFile[];
}

export type Page = 'lancedb' | 'workspaces' | 'stats';

// 頂層 Dashboard 切換（deprecated — 改用 AppPage）
export type Dashboard = 'memory' | 'skills';

// Memory Dashboard 的 sub-page（deprecated — 改用 AppPage）
export type MemoryPage = 'lancedb' | 'workspaces' | 'stats';

// 統一頁面導航
export type AppPage = 'lancedb' | 'workspaces' | 'stats' | 'skills' | 'agents' | 'cron-jobs';

// Skills 選取狀態
export type SkillSelection =
  | { type: 'overview' }
  | { type: 'owner'; name: string }
  | { type: 'skill'; ownerName: string; skillName: string };

// Skills 型別
export interface Skill {
  name: string;
  description: string;
  homepage?: string;
  version?: string;
  files: { name: string; size: number }[];
  totalSize: number;
}

export interface SkillOwner {
  name: string;
  label: string;
  skills: Skill[];
}

export interface SkillsResponse {
  owners: SkillOwner[];
  totalSkills: number;
}

// Agents 型別
export interface AgentInfo {
  id: string;
  name: string;
  displayName: string;
  model: string;
  workspace: string;
  description: string;
  subagents: string[];
  bindings: { channel: string; accountId: string }[];
}

export interface AgentsResponse {
  agents: AgentInfo[];
  defaults: {
    model: { primary?: string; fallbacks?: string[] };
    maxConcurrent: number;
  };
}

// Agents 選取狀態
export type AgentSelection =
  | { type: 'overview' }
  | { type: 'agent'; id: string };

// Cron Jobs 型別
export interface CronJob {
  id: string;
  agentId: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr?: string;
    everyMs?: number;
    at?: string;
    tz?: string;
  };
  state: {
    lastRunAtMs?: number;
    lastRunStatus?: string;
    lastDurationMs?: number;
    nextRunAtMs?: number;
    consecutiveErrors: number;
    lastError?: string;
  };
  delivery?: {
    mode: string;
    channel: string;
    to: string;
  };
}

export interface CronJobsResponse {
  jobs: CronJob[];
}

// Cron Jobs 篩選
export type CronFilter = 'all' | 'enabled' | 'disabled' | 'errors';
