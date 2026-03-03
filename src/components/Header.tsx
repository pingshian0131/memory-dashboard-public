import type { Page } from '../types';
import { theme } from '../theme';

const tabs: { id: Page; label: string }[] = [
  { id: 'lancedb', label: 'LanceDB' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'stats', label: 'Stats' },
];

export function Header({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      height: 48,
      background: theme.bgCard,
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ color: theme.green, fontWeight: 700, fontSize: 15 }}>
          {'>'} Memory Dashboard
        </span>
        <nav style={{ display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onNavigate(t.id)}
              style={{
                background: page === t.id ? theme.greenDim : 'transparent',
                border: `1px solid ${page === t.id ? theme.greenDim : theme.border}`,
                borderRadius: 4,
                color: page === t.id ? '#fff' : theme.textDim,
                fontFamily: theme.font,
                fontSize: 13,
                padding: '4px 14px',
                cursor: 'pointer',
              }}
            >
              [{t.label}]
            </button>
          ))}
        </nav>
      </div>
      <span style={{ color: theme.textDim, fontSize: 12 }}>v0.1.0</span>
    </header>
  );
}
