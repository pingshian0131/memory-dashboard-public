import { useState, useEffect } from 'react';
import type { Memory, MemoryInput } from '../types';
import { css, theme } from '../theme';

const CATEGORIES = ['fact', 'decision', 'preference', 'entity', 'other'];

export function MemoryForm({ memory, scopes, onSubmit, onCancel }: {
  memory?: Memory;
  scopes: string[];
  onSubmit: (data: MemoryInput) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(memory?.text ?? '');
  const [category, setCategory] = useState(memory?.category ?? 'fact');
  const [scope, setScope] = useState(memory?.scope ?? 'global');
  const [importance, setImportance] = useState(memory?.importance ?? 0.5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (memory) {
      setText(memory.text);
      setCategory(memory.category);
      setScope(memory.scope);
      setImportance(memory.importance);
    }
  }, [memory]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ text, category, scope, importance });
    } finally {
      setSubmitting(false);
    }
  };

  const selectStyle = {
    ...css.input,
    width: 'auto',
    minWidth: 140,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onCancel}>
      <div style={{
        ...css.card,
        width: 520,
        maxHeight: '80vh',
        overflow: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: theme.green, marginBottom: 16, fontSize: 15 }}>
          {'>'} {memory ? 'Edit Memory' : 'New Memory'}
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={css.dimText}>text</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            style={{ ...css.input, resize: 'vertical', marginTop: 4 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={css.dimText}>category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...selectStyle, marginTop: 4 }}>
              {CATEGORIES.map(c => <option key={c} value={c}>[{c}]</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={css.dimText}>scope</label>
            <select value={scope} onChange={e => setScope(e.target.value)} style={{ ...selectStyle, marginTop: 4 }}>
              {scopes.map(s => <option key={s} value={s}>{s}</option>)}
              {!scopes.includes(scope) && <option value={scope}>{scope}</option>}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={css.dimText}>importance: {importance.toFixed(2)}</label>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={importance}
            onChange={e => setImportance(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: 4, accentColor: theme.green }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ ...css.button, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.textDim }}>
            cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={css.button}>
            {submitting ? 'saving...' : memory ? 'update' : 'create'}
          </button>
        </div>
      </div>
    </div>
  );
}
