import * as lancedb from '@lancedb/lancedb';
import OpenAI from 'openai';
import { randomUUID } from 'node:crypto';

const MEMORY_DB_PATH = process.env.MEMORY_DB_PATH || '/data/memory-db';
const TABLE_NAME = 'memories';

let db: lancedb.Connection | null = null;
let table: lancedb.Table | null = null;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getTable(): Promise<lancedb.Table> {
  if (table) return table;
  db = await lancedb.connect(MEMORY_DB_PATH);
  table = await db.openTable(TABLE_NAME);
  return table;
}

export interface MemoryRecord {
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

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding;
}

export async function listMemories(opts: {
  scope?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ memories: MemoryRecord[]; total: number }> {
  const t = await getTable();
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const filters: string[] = [];
  if (opts.scope) filters.push(`scope = '${opts.scope.replace(/'/g, "''")}'`);
  if (opts.category) filters.push(`category = '${opts.category.replace(/'/g, "''")}'`);

  // Get total count
  let countQuery = t.query();
  if (filters.length > 0) countQuery = countQuery.where(filters.join(' AND '));
  const allRows = await countQuery.select(['id']).toArray();
  const total = allRows.length;

  // If search keyword, use full-text search
  if (opts.search && opts.search.trim()) {
    const searchQuery = t.search(opts.search, 'text').select(['id', 'text', 'category', 'scope', 'importance', 'timestamp', 'metadata']).limit(limit + offset);
    if (filters.length > 0) searchQuery.where(filters.join(' AND '));
    const results = await searchQuery.toArray();
    const sliced = results.slice(offset, offset + limit);
    return {
      memories: sliced.map(rowToMemory),
      total: results.length,
    };
  }

  // Normal list with sort by timestamp desc
  let query = t.query().select(['id', 'text', 'category', 'scope', 'importance', 'timestamp', 'metadata']);
  if (filters.length > 0) query = query.where(filters.join(' AND '));
  const rows = await query.limit(limit + offset).toArray();
  // Sort by timestamp descending
  rows.sort((a: any, b: any) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  const sliced = rows.slice(offset, offset + limit);

  return { memories: sliced.map(rowToMemory), total };
}

export async function getMemory(id: string): Promise<MemoryRecord | null> {
  const t = await getTable();
  const rows = await t.query()
    .where(`id = '${id.replace(/'/g, "''")}'`)
    .select(['id', 'text', 'category', 'scope', 'importance', 'timestamp', 'metadata'])
    .limit(1)
    .toArray();
  return rows.length > 0 ? rowToMemory(rows[0]) : null;
}

export async function createMemory(input: MemoryInput): Promise<MemoryRecord> {
  const t = await getTable();
  const id = randomUUID();
  const vector = await embed(input.text);
  const timestamp = Date.now();
  const record = {
    id,
    text: input.text,
    vector,
    category: input.category,
    scope: input.scope,
    importance: input.importance,
    timestamp,
    metadata: input.metadata ?? '{}',
  };
  await t.add([record]);
  return { id, text: input.text, category: input.category, scope: input.scope, importance: input.importance, timestamp, metadata: record.metadata };
}

export async function updateMemory(id: string, input: Partial<MemoryInput>): Promise<MemoryRecord | null> {
  const t = await getTable();
  const existing = await getMemory(id);
  if (!existing) return null;

  const updatedText = input.text ?? existing.text;
  const needsReEmbed = input.text && input.text !== existing.text;
  const vector = needsReEmbed ? await embed(updatedText) : undefined;

  const updateData: any = {};
  if (input.text !== undefined) updateData.text = input.text;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.scope !== undefined) updateData.scope = input.scope;
  if (input.importance !== undefined) updateData.importance = input.importance;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;
  if (vector) updateData.vector = vector;

  await t.update({ where: `id = '${id.replace(/'/g, "''")}'`, values: updateData });
  return getMemory(id);
}

export async function deleteMemory(id: string): Promise<boolean> {
  const t = await getTable();
  await t.delete(`id = '${id.replace(/'/g, "''")}'`);
  return true;
}

export async function getScopes(): Promise<{ scope: string; count: number }[]> {
  const t = await getTable();
  const rows = await t.query().select(['scope']).toArray();
  const counts = new Map<string, number>();
  for (const r of rows) {
    const s = (r as any).scope ?? 'unknown';
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([scope, count]) => ({ scope, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getStats(): Promise<{
  total: number;
  byScope: { scope: string; count: number }[];
  byCategory: { category: string; count: number }[];
}> {
  const t = await getTable();
  const rows = await t.query().select(['scope', 'category']).toArray();
  const scopeCounts = new Map<string, number>();
  const catCounts = new Map<string, number>();
  for (const r of rows) {
    const s = (r as any).scope ?? 'unknown';
    const c = (r as any).category ?? 'other';
    scopeCounts.set(s, (scopeCounts.get(s) ?? 0) + 1);
    catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  }
  return {
    total: rows.length,
    byScope: Array.from(scopeCounts.entries()).map(([scope, count]) => ({ scope, count })).sort((a, b) => b.count - a.count),
    byCategory: Array.from(catCounts.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
  };
}

function rowToMemory(row: any): MemoryRecord {
  return {
    id: row.id,
    text: row.text,
    category: row.category ?? 'other',
    scope: row.scope ?? 'global',
    importance: row.importance ?? 0.5,
    timestamp: row.timestamp ?? 0,
    metadata: row.metadata ?? '{}',
  };
}
