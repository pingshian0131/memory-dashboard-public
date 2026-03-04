import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CronJob, CronFilter } from '../types';
import { fetchCronJobs } from '../api';
import { css, theme } from '../theme';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = Math.floor(secs % 60);
  return `${mins}m ${remSecs}s`;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
}

function relativeTime(ms: number): string {
  const now = Date.now();
  const diff = ms - now;
  if (diff < 0) {
    const ago = Math.abs(diff);
    if (ago < 60000) return `${Math.floor(ago / 1000)}s ago`;
    if (ago < 3600000) return `${Math.floor(ago / 60000)}m ago`;
    if (ago < 86400000) return `${Math.floor(ago / 3600000)}h ago`;
    return `${Math.floor(ago / 86400000)}d ago`;
  }
  if (diff < 60000) return `in ${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `in ${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `in ${Math.floor(diff / 3600000)}h`;
  return `in ${Math.floor(diff / 86400000)}d`;
}

function scheduleLabel(job: CronJob): string {
  const s = job.schedule;
  if (s.kind === 'cron' && s.expr) return `cron: ${s.expr}`;
  if (s.kind === 'every' && s.everyMs) {
    const hours = s.everyMs / 3600000;
    return hours >= 1 ? `every ${hours}h` : `every ${s.everyMs / 60000}m`;
  }
  if (s.kind === 'at' && s.at) return `at: ${s.at}`;
  return s.kind;
}

function statusColor(status?: string): string {
  if (status === 'ok') return theme.green;
  if (status === 'error') return theme.red;
  if (status === 'skipped') return theme.yellow;
  if (status === 'running') return theme.cyan;
  return theme.textDim;
}

function JobCard({ job }: { job: CronJob }) {
  const hasError = job.state.consecutiveErrors > 0 || job.state.lastRunStatus === 'error';

  return (
    <div style={{
      ...css.card,
      marginBottom: 8,
      opacity: job.enabled ? 1 : 0.5,
      borderColor: hasError ? theme.red : theme.border,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: theme.text, fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
            {job.name}
          </div>
          {job.description && (
            <div style={{ ...css.dimText, marginTop: 2, lineHeight: 1.3 }}>
              {job.description.length > 80 ? job.description.slice(0, 80) + '...' : job.description}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
          <span style={{
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 4,
            background: theme.bg,
            border: `1px solid ${theme.cyan}`,
            color: theme.cyan,
          }}>
            {job.agentId}
          </span>
          <span style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 4,
            background: job.enabled ? theme.greenDim : 'transparent',
            border: `1px solid ${job.enabled ? theme.greenDim : theme.textDim}`,
            color: job.enabled ? '#fff' : theme.textDim,
          }}>
            {job.enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Schedule */}
      <div style={{ ...css.dimText, marginBottom: 6 }}>
        {scheduleLabel(job)}
        {job.schedule.tz && <span style={{ marginLeft: 8 }}>({job.schedule.tz})</span>}
      </div>

      {/* Status row */}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
        {job.state.lastRunStatus && (
          <span>
            <span style={{ color: theme.textDim }}>last: </span>
            <span style={{ color: statusColor(job.state.lastRunStatus), fontWeight: 600 }}>
              {job.state.lastRunStatus}
            </span>
            {job.state.lastRunAtMs && (
              <span style={{ color: theme.textDim, marginLeft: 4 }}>
                {relativeTime(job.state.lastRunAtMs)}
              </span>
            )}
          </span>
        )}
        {job.state.lastDurationMs != null && (
          <span style={{ color: theme.textDim }}>
            took {formatDuration(job.state.lastDurationMs)}
          </span>
        )}
        {job.state.nextRunAtMs && (
          <span>
            <span style={{ color: theme.textDim }}>next: </span>
            <span style={{ color: theme.cyan }}>{relativeTime(job.state.nextRunAtMs)}</span>
          </span>
        )}
      </div>

      {/* Error */}
      {hasError && job.state.lastError && (
        <div style={{
          marginTop: 6,
          padding: '4px 8px',
          background: 'rgba(248,81,73,0.1)',
          borderRadius: 4,
          fontSize: 11,
          color: theme.red,
          lineHeight: 1.4,
        }}>
          {job.state.consecutiveErrors > 1 && (
            <span style={{ fontWeight: 700 }}>({job.state.consecutiveErrors}x) </span>
          )}
          {job.state.lastError.length > 120 ? job.state.lastError.slice(0, 120) + '...' : job.state.lastError}
        </div>
      )}
    </div>
  );
}

export function CronJobsPage({
  onSidebarChange,
}: {
  onSidebarChange: (content: ReactNode) => void;
}) {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<CronFilter>('all');
  const [agentFilter, setAgentFilter] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchCronJobs()
      .then(data => { setJobs(data.jobs); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Get unique agents
  const agentIds = [...new Set(jobs.map(j => j.agentId))].sort();

  // Build sidebar
  useEffect(() => {
    const filters: { id: CronFilter; label: string }[] = [
      { id: 'all', label: 'all' },
      { id: 'enabled', label: 'enabled' },
      { id: 'disabled', label: 'disabled' },
      { id: 'errors', label: 'errors' },
    ];

    const sidebar = (
      <div>
        <div style={{ padding: '4px 16px', color: theme.green, fontSize: 11, fontWeight: 700 }}>STATUS</div>
        {filters.map(f => (
          <div
            key={f.id}
            onClick={() => { setFilter(f.id); setAgentFilter(null); }}
            style={{
              padding: '4px 16px',
              cursor: 'pointer',
              fontSize: 12,
              color: filter === f.id && !agentFilter ? theme.green : theme.textDim,
              background: filter === f.id && !agentFilter ? theme.bgHover : 'transparent',
            }}
          >
            {f.label}
          </div>
        ))}
        {agentIds.length > 0 && (
          <>
            <div style={{ padding: '8px 16px 4px', color: theme.green, fontSize: 11, fontWeight: 700, borderTop: `1px solid ${theme.border}`, marginTop: 8 }}>
              BY AGENT
            </div>
            {agentIds.map(id => {
              const count = jobs.filter(j => j.agentId === id).length;
              return (
                <div
                  key={id}
                  onClick={() => { setAgentFilter(id); setFilter('all'); }}
                  style={{
                    padding: '4px 16px',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: agentFilter === id ? theme.cyan : theme.textDim,
                    background: agentFilter === id ? theme.bgHover : 'transparent',
                  }}
                >
                  <span>{id}</span>
                  <span style={{
                    background: theme.bgCard,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    padding: '0 6px',
                    fontSize: 10,
                    color: theme.textDim,
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
    onSidebarChange(sidebar);
    return () => onSidebarChange(null);
  }, [onSidebarChange, filter, agentFilter, jobs, agentIds.length]);

  if (loading) return <div style={css.dimText}>loading cron jobs...</div>;
  if (error) return <div style={{ color: theme.red, fontSize: 13 }}>{error}</div>;

  let filtered = jobs;
  if (agentFilter) {
    filtered = filtered.filter(j => j.agentId === agentFilter);
  }
  if (filter === 'enabled') filtered = filtered.filter(j => j.enabled);
  if (filter === 'disabled') filtered = filtered.filter(j => !j.enabled);
  if (filter === 'errors') filtered = filtered.filter(j => j.state.consecutiveErrors > 0 || j.state.lastRunStatus === 'error');

  const enabledCount = jobs.filter(j => j.enabled).length;
  const errorCount = jobs.filter(j => j.state.consecutiveErrors > 0).length;

  return (
    <div>
      <div style={{ marginBottom: 12, ...css.dimText }}>
        {filtered.length} jobs
        {agentFilter && <span> ({agentFilter})</span>}
        {filter !== 'all' && <span> [{filter}]</span>}
        <span style={{ marginLeft: 12 }}>
          {enabledCount} enabled
          {errorCount > 0 && <span style={{ color: theme.red, marginLeft: 8 }}>{errorCount} errors</span>}
        </span>
      </div>
      {filtered.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
