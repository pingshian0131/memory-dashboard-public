import { useState } from 'react';
import { css, theme } from '../theme';

export function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.greenDim, fontSize: 13 }}>
          {'>'}
        </span>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSearch(value); }}
          placeholder="search memories..."
          style={{ ...css.input, paddingLeft: 28 }}
        />
      </div>
      <button onClick={() => onSearch(value)} style={css.button}>search</button>
    </div>
  );
}
