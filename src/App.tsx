import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppPage, SkillOwner, SkillSelection, AgentInfo, AgentSelection } from './types';
import { fetchSkills, fetchAgents } from './api';
import { Header } from './components/Header';
import { Layout } from './components/Layout';
import { LanceDBPage } from './pages/LanceDBPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { StatsPage } from './pages/StatsPage';
import { SkillsContent, sectionLabel } from './pages/SkillsPage';
import { AgentsPage } from './pages/AgentsPage';
import { CronJobsPage } from './pages/CronJobsPage';
import { css, theme } from './theme';

const memoryNavItems: { id: AppPage; label: string }[] = [
  { id: 'lancedb', label: 'LanceDB' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'stats', label: 'Stats' },
];

type SidebarSection = 'memory' | 'agents' | 'cron-jobs' | 'skills';

const memoryPages: AppPage[] = ['lancedb', 'workspaces', 'stats'];

function pageToSection(p: AppPage): SidebarSection {
  if (memoryPages.includes(p)) return 'memory';
  if (p === 'agents') return 'agents';
  if (p === 'cron-jobs') return 'cron-jobs';
  return 'skills';
}

export default function App() {
  const [page, setPage] = useState<AppPage>('lancedb');
  const [pageSidebar, setPageSidebar] = useState<ReactNode>(null);

  // Sidebar collapse — 展開一個自動收合另一個
  const [expanded, setExpanded] = useState<SidebarSection>('memory');

  // Skills data (loaded at App level for sidebar)
  const [skillOwners, setSkillOwners] = useState<SkillOwner[]>([]);
  const [totalSkills, setTotalSkills] = useState(0);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState('');
  const [skillSelection, setSkillSelection] = useState<SkillSelection>({ type: 'overview' });

  // Agents data (loaded at App level for sidebar)
  const [agentsList, setAgentsList] = useState<AgentInfo[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState('');
  const [agentSelection, setAgentSelection] = useState<AgentSelection>({ type: 'overview' });

  const loadSkills = useCallback(() => {
    setSkillsLoading(true);
    fetchSkills()
      .then(data => {
        setSkillOwners(data.owners);
        setTotalSkills(data.totalSkills);
        setSkillsLoading(false);
      })
      .catch(e => {
        setSkillsError(e.message);
        setSkillsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadSkills();

    fetchAgents()
      .then(data => {
        setAgentsList(data.agents);
        setAgentsLoading(false);
      })
      .catch(e => {
        setAgentsError(e.message);
        setAgentsLoading(false);
      });
  }, [loadSkills]);

  const handlePageSidebarChange = useCallback((content: ReactNode) => {
    setPageSidebar(content);
  }, []);

  // Keep expanded section in sync with page
  useEffect(() => {
    setExpanded(pageToSection(page));
  }, [page]);

  // Group owners into sections
  const globalOwners = skillOwners.filter(o => o.name === 'global');
  const sharedOwners = skillOwners.filter(o => o.name === 'shared');
  const agentOwners = skillOwners.filter(o => o.name !== 'global' && o.name !== 'shared');

  const renderSkillOwnerSection = (sectionName: string, sectionOwners: SkillOwner[]) => {
    if (sectionOwners.length === 0) return null;
    return (
      <div key={sectionName}>
        <div style={{ padding: '8px 16px 4px', color: theme.green, fontSize: 11, fontWeight: 700 }}>
          {sectionName}
        </div>
        {sectionOwners.map(owner => (
          <div key={owner.name}>
            <div
              onClick={() => { setPage('skills'); setSkillSelection({ type: 'owner', name: owner.name }); }}
              style={{
                padding: '5px 16px',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: (page === 'skills' && skillSelection.type === 'owner' && skillSelection.name === owner.name) ||
                       (page === 'skills' && skillSelection.type === 'skill' && skillSelection.ownerName === owner.name)
                  ? theme.green : theme.text,
                fontWeight: (page === 'skills' && skillSelection.type === 'owner' && skillSelection.name === owner.name) ? 700 : 400,
                background: (page === 'skills' && skillSelection.type === 'owner' && skillSelection.name === owner.name) ? theme.bgHover : 'transparent',
              }}
            >
              <span>{sectionLabel(owner)}</span>
              <span style={{
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                padding: '0 6px',
                fontSize: 10,
                color: theme.textDim,
              }}>
                {owner.skills.length}
              </span>
            </div>
            {owner.skills.map(skill => (
              <div
                key={skill.name}
                onClick={() => { setPage('skills'); setSkillSelection({ type: 'skill', ownerName: owner.name, skillName: skill.name }); }}
                style={{
                  padding: '3px 16px 3px 32px',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: (page === 'skills' && skillSelection.type === 'skill' && skillSelection.ownerName === owner.name && skillSelection.skillName === skill.name)
                    ? theme.cyan : theme.textDim,
                  background: (page === 'skills' && skillSelection.type === 'skill' && skillSelection.ownerName === owner.name && skillSelection.skillName === skill.name)
                    ? theme.bgHover : 'transparent',
                }}
              >
                {skill.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Section header helper
  const sectionHeader = (
    section: SidebarSection,
    label: string,
    count?: number,
    defaultPage: AppPage = section as AppPage,
  ) => (
    <div
      onClick={() => {
        if (expanded === section) return;
        setExpanded(section);
        setPage(defaultPage);
        if (section === 'skills') setSkillSelection({ type: 'overview' });
        if (section === 'agents') setAgentSelection({ type: 'overview' });
      }}
      style={{
        padding: '0 16px 8px',
        color: expanded === section ? theme.green : theme.textDim,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 10 }}>{expanded === section ? 'v' : '>'}</span>
      {label}
      {count != null && <span style={{ fontWeight: 400, fontSize: 11 }}>({count})</span>}
    </div>
  );

  const unifiedSidebar = (
    <div>
      {/* MEMORY section */}
      {sectionHeader('memory', 'MEMORY', undefined, 'lancedb')}
      {expanded === 'memory' && (
        <>
          {memoryNavItems.map(item => (
            <div
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                padding: '6px 16px',
                cursor: 'pointer',
                fontSize: 13,
                color: page === item.id ? theme.green : theme.textDim,
                background: page === item.id ? theme.bgHover : 'transparent',
                borderLeft: page === item.id ? `2px solid ${theme.green}` : '2px solid transparent',
              }}
            >
              {item.label}
            </div>
          ))}
          {pageSidebar && (
            <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 8, paddingTop: 8 }}>
              {pageSidebar}
            </div>
          )}
        </>
      )}

      {/* AGENTS section */}
      <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 8, paddingTop: 8 }}>
        {sectionHeader('agents', 'AGENTS', agentsLoading ? undefined : agentsList.length)}
        {expanded === 'agents' && (
          <>
            {agentsLoading ? (
              <div style={{ padding: '4px 16px', ...css.dimText }}>loading...</div>
            ) : agentsError ? (
              <div style={{ padding: '4px 16px', color: theme.red, fontSize: 12 }}>{agentsError}</div>
            ) : (
              <>
                <div
                  onClick={() => { setPage('agents'); setAgentSelection({ type: 'overview' }); }}
                  style={{
                    padding: '5px 16px',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: page === 'agents' && agentSelection.type === 'overview' ? theme.green : theme.textDim,
                    background: page === 'agents' && agentSelection.type === 'overview' ? theme.bgHover : 'transparent',
                  }}
                >
                  Overview
                </div>
                {agentsList.map(agent => (
                  <div
                    key={agent.id}
                    onClick={() => { setPage('agents'); setAgentSelection({ type: 'agent', id: agent.id }); }}
                    style={{
                      padding: '4px 16px',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: page === 'agents' && agentSelection.type === 'agent' && agentSelection.id === agent.id
                        ? theme.cyan : theme.textDim,
                      background: page === 'agents' && agentSelection.type === 'agent' && agentSelection.id === agent.id
                        ? theme.bgHover : 'transparent',
                    }}
                  >
                    {agent.id}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* CRON JOBS section */}
      <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 8, paddingTop: 8 }}>
        {sectionHeader('cron-jobs', 'CRON JOBS')}
        {expanded === 'cron-jobs' && pageSidebar && (
          <div>{pageSidebar}</div>
        )}
      </div>

      {/* SKILLS section */}
      <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 8, paddingTop: 8 }}>
        {sectionHeader('skills', 'SKILLS', skillsLoading ? undefined : totalSkills)}
        {expanded === 'skills' && (
          <>
            {skillsLoading ? (
              <div style={{ padding: '4px 16px', ...css.dimText }}>loading...</div>
            ) : skillsError ? (
              <div style={{ padding: '4px 16px', color: theme.red, fontSize: 12 }}>{skillsError}</div>
            ) : (
              <>
                {renderSkillOwnerSection('GLOBAL', globalOwners)}
                {renderSkillOwnerSection('SHARED', sharedOwners)}
                {agentOwners.length > 0 && renderSkillOwnerSection('AGENTS', agentOwners)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: theme.font, background: theme.bg, color: theme.text }}>
      <Header />
      <Layout sidebar={unifiedSidebar}>
        {page === 'lancedb' && <LanceDBPage onSidebarChange={handlePageSidebarChange} />}
        {page === 'workspaces' && <WorkspacePage onSidebarChange={handlePageSidebarChange} />}
        {page === 'stats' && <StatsPage onSidebarChange={handlePageSidebarChange} />}
        {page === 'agents' && (
          <AgentsPage
            agents={agentsList}
            selection={agentSelection}
            setSelection={setAgentSelection}
            loading={agentsLoading}
            error={agentsError}
            onSidebarChange={handlePageSidebarChange}
          />
        )}
        {page === 'cron-jobs' && <CronJobsPage onSidebarChange={handlePageSidebarChange} />}
        {page === 'skills' && (
          <SkillsContent
            owners={skillOwners}
            totalSkills={totalSkills}
            selection={skillSelection}
            loading={skillsLoading}
            error={skillsError}
            onRefresh={loadSkills}
          />
        )}
      </Layout>
    </div>
  );
}
