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
