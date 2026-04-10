import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = '検索...',
}) => {
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-card)',
    border: `1px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
    background: 'var(--color-bg)',
    transition: 'all var(--transition)',
    boxShadow: focused ? '0 0 0 3px rgba(232, 99, 74, 0.12)' : 'none',
  };

  const iconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--color-text-secondary)',
    flexShrink: 0,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    lineHeight: 1.5,
  };

  const clearButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    border: 'none',
    background: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'all var(--transition)',
  };

  const shortcutBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '2px 6px',
    borderRadius: 'var(--radius-button)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
  };

  return (
    <div style={containerStyle}>
      <span style={iconStyle}>
        <Search size={16} />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {value ? (
        <button
          style={clearButtonStyle}
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      ) : (
        <span style={shortcutBadgeStyle}>
          <span style={{ fontSize: '12px' }}>&#8984;</span>K
        </span>
      )}
    </div>
  );
};

export default SearchBar;
