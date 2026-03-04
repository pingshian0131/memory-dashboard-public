import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AgentInfo, AgentSelection } from '../types';
import { css, theme } from '../theme';

function modelShort(model: string): string {
  const parts = model.split('/');
  const name = parts[parts.length - 1];
  if (name.includes('opus')) return 'Opus';
  if (name.includes('sonnet')) return 'Sonnet';
  if (name.includes('haiku')) return 'Haiku';
  if (name.includes('gpt-5.3')) return 'GPT-5.3';
  if (name.includes('gpt-5.2')) return 'GPT-5.2';
  if (name.includes('gpt-5.1')) return 'GPT-5.1';
  return name;
}

function modelColor(model: string): string {
  if (model.includes('opus')) return '#d2a8ff';
  if (model.includes('sonnet')) return theme.cyan;
  if (model.includes('haiku')) return theme.green;
  if (model.includes('gpt-5.3')) return '#ffa657';
  if (model.includes('gpt-5.2')) return theme.yellow;
  if (model.includes('gpt-5.1')) return '#d29922';
  return theme.textDim;
}

function AgentCard({ agent, onClick }: { agent: AgentInfo; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...css.card,
        cursor: 'pointer',
        marginBottom: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: theme.green, fontWeight: 700, fontSize: 14 }}>{agent.id}</span>
          {agent.displayName && (
            <span style={{ color: theme.textDim, fontSize: 12, marginLeft: 8 }}>{agent.displayName}</span>
          )}
        </div>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 8,
          background: theme.bg,
          border: `1px solid ${modelColor(agent.model)}`,
          color: modelColor(agent.model),
        }}>
          {modelShort(agent.model)}
        </span>
      </div>
      {agent.description && (
        <div style={{ ...css.dimText, lineHeight: 1.4 }}>{agent.description}</div>
      )}
      <div style={{ display: 'flex', gap: 12, ...css.dimText }}>
        <span>subagents: {agent.subagents.length}</span>
        <span>channels: {agent.bindings.length}</span>
      </div>
    </div>
  );
}

function AgentDetail({ agent }: { agent: AgentInfo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, color: theme.green, fontSize: 18 }}>
          {agent.id}
          {agent.displayName && (
            <span style={{ color: theme.textDim, fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
              {agent.displayName}
            </span>
          )}
        </h2>
      </div>

      {agent.description && (
        <div style={{ ...css.card }}>
          <div style={{ color: theme.textDim, fontSize: 11, marginBottom: 4 }}>DESCRIPTION</div>
          <div style={{ color: theme.text, fontSize: 13, lineHeight: 1.5 }}>{agent.description}</div>
        </div>
      )}

      <div style={{ ...css.card }}>
        <div style={{ color: theme.textDim, fontSize: 11, marginBottom: 4 }}>MODEL</div>
        <span style={{
          fontSize: 12,
          padding: '2px 8px',
          borderRadius: 8,
          background: theme.bg,
          border: `1px solid ${modelColor(agent.model)}`,
          color: modelColor(agent.model),
        }}>
          {agent.model}
        </span>
      </div>

      <div style={{ ...css.card }}>
        <div style={{ color: theme.textDim, fontSize: 11, marginBottom: 4 }}>WORKSPACE</div>
        <div style={{ color: theme.cyan, fontSize: 13 }}>{agent.workspace}</div>
      </div>

      {agent.subagents.length > 0 && (
        <div style={{ ...css.card }}>
          <div style={{ color: theme.textDim, fontSize: 11, marginBottom: 8 }}>SUBAGENTS ({agent.subagents.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {agent.subagents.map(s => (
              <span key={s} style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                background: theme.bgHover,
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {agent.bindings.length > 0 && (
        <div style={{ ...css.card }}>
          <div style={{ color: theme.textDim, fontSize: 11, marginBottom: 8 }}>CHANNELS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {agent.bindings.map((b, i) => (
              <div key={i} style={{ fontSize: 12, color: theme.text }}>
                <span style={{ color: b.channel === 'discord' ? '#5865F2' : '#229ED9', fontWeight: 600 }}>
                  {b.channel}
                </span>
                <span style={{ color: theme.textDim, marginLeft: 8 }}>{b.accountId}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentsContent({
  agents,
  selection,
  loading,
  error,
}: {
  agents: AgentInfo[];
  selection: AgentSelection;
  loading: boolean;
  error: string;
}) {
  if (loading) return <div style={css.dimText}>loading agents...</div>;
  if (error) return <div style={{ color: theme.red, fontSize: 13 }}>{error}</div>;

  if (selection.type === 'agent') {
    const agent = agents.find(a => a.id === selection.id);
    if (!agent) return <div style={css.dimText}>agent not found</div>;
    return <AgentDetail agent={agent} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 12, ...css.dimText }}>{agents.length} agents</div>
      {agents.map(agent => (
        <AgentCard key={agent.id} agent={agent} onClick={() => {}} />
      ))}
    </div>
  );
}

export function AgentsPage({
  agents,
  selection,
  setSelection,
  loading,
  error,
  onSidebarChange,
}: {
  agents: AgentInfo[];
  selection: AgentSelection;
  setSelection: (s: AgentSelection) => void;
  loading: boolean;
  error: string;
  onSidebarChange: (content: ReactNode) => void;
}) {
  useEffect(() => {
    onSidebarChange(null);
    return () => onSidebarChange(null);
  }, [onSidebarChange]);

  if (loading) return <div style={css.dimText}>loading agents...</div>;
  if (error) return <div style={{ color: theme.red, fontSize: 13 }}>{error}</div>;

  if (selection.type === 'agent') {
    const agent = agents.find(a => a.id === selection.id);
    if (!agent) return <div style={css.dimText}>agent not found</div>;
    return <AgentDetail agent={agent} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 12, ...css.dimText }}>{agents.length} agents</div>
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onClick={() => setSelection({ type: 'agent', id: agent.id })}
        />
      ))}
    </div>
  );
}
