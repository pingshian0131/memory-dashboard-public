import { useState } from 'react';
import type { Page } from './types';
import { Header } from './components/Header';
import { LanceDBPage } from './pages/LanceDBPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { StatsPage } from './pages/StatsPage';
import { theme } from './theme';

export default function App() {
  const [page, setPage] = useState<Page>('lancedb');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: theme.font, background: theme.bg, color: theme.text }}>
      <Header page={page} onNavigate={setPage} />
      {page === 'lancedb' && <LanceDBPage />}
      {page === 'workspaces' && <WorkspacePage />}
      {page === 'stats' && <StatsPage />}
    </div>
  );
}
