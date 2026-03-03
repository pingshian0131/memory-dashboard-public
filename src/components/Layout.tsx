import type { ReactNode } from 'react';
import { theme } from '../theme';

export function Layout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <aside style={{
        width: 220,
        minWidth: 220,
        borderRight: `1px solid ${theme.border}`,
        padding: '12px 0',
        overflowY: 'auto',
        background: theme.bg,
      }}>
        {sidebar}
      </aside>
      <main style={{ flex: 1, padding: 20, overflowY: 'auto', background: theme.bg }}>
        {children}
      </main>
    </div>
  );
}
