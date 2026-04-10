import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  placeholder,
}) => {
  const [focused, setFocused] = React.useState(false);
  const selectId = React.useId();

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-body)',
  };

  const selectWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 36px 8px 12px',
    borderRadius: 'var(--radius-card)',
    border: `1px solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
    background: 'var(--color-bg)',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    color: value ? 'var(--color-text)' : 'var(--color-text-secondary)',
    appearance: 'none',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    boxShadow: focused ? '0 0 0 3px rgba(232, 99, 74, 0.12)' : 'none',
    lineHeight: 1.5,
  };

  const chevronStyle: React.CSSProperties = {
    position: 'absolute',
    right: '10px',
    pointerEvents: 'none',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--color-danger)',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label htmlFor={selectId} style={labelStyle}>
          {label}
        </label>
      )}
      <div style={selectWrapperStyle}>
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={selectStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span style={chevronStyle}>
          <ChevronDown size={16} />
        </span>
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};

export default Select;
