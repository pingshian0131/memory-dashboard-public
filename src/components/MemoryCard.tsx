import type { Memory } from '../types';
import { css, theme } from '../theme';

function formatTime(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function MemoryCard({ memory, onDelete, onEdit }: {
  memory: Memory;
  onDelete: (id: string) => void;
  onEdit: (m: Memory) => void;
}) {
  return (
    <div style={{ ...css.card, marginBottom: 8, position: 'relative' }}>
      {/* Top row: scope | id ... score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={css.dimText}>
          scope:<span style={{ color: theme.cyan }}>{memory.scope}</span>
          {' | '}
          <span style={{ color: theme.textDim }}>{memory.id.slice(0, 8)}...</span>
        </span>
        <span style={css.score}>{memory.importance.toFixed(1)}</span>
      </div>

      {/* Content */}
      <div style={{ marginBottom: 8, lineHeight: 1.6, fontSize: 13, color: theme.text }}>
        <span style={css.tag}>[{memory.category}]</span>{' '}
        {memory.text.length > 200 ? memory.text.slice(0, 200) + '...' : memory.text}
      </div>

      {/* Bottom row: timestamp + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={css.dimText}>{formatTime(memory.timestamp)}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onEdit(memory)}
            style={{ ...css.button, padding: '3px 10px', fontSize: 12, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.textDim }}
          >
            edit
          </button>
          <button onClick={() => onDelete(memory.id)} style={css.buttonDanger}>
            del
          </button>
        </div>
      </div>
    </div>
  );
}
