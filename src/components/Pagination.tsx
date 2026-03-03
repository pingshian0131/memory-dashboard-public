import { css, theme } from '../theme';

export function Pagination({ offset, limit, total, onChange }: {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  const btnStyle = {
    ...css.button,
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    color: theme.textDim,
    padding: '4px 12px',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
      <button
        onClick={() => onChange(Math.max(0, offset - limit))}
        disabled={page <= 1}
        style={{ ...btnStyle, opacity: page <= 1 ? 0.3 : 1 }}
      >
        {'<'}
      </button>
      <span style={css.dimText}>{page} / {totalPages}</span>
      <button
        onClick={() => onChange(offset + limit)}
        disabled={page >= totalPages}
        style={{ ...btnStyle, opacity: page >= totalPages ? 0.3 : 1 }}
      >
        {'>'}
      </button>
    </div>
  );
}
