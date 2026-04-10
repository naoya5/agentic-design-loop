import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  id,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);
  const inputId = id || React.useId();

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

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: 'var(--radius-card)',
    border: `1px solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
    background: 'var(--color-bg)',
    transition: 'all var(--transition)',
    boxShadow: focused ? '0 0 0 3px rgba(232, 99, 74, 0.12)' : 'none',
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

  const iconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    color: 'var(--color-text-secondary)',
    flexShrink: 0,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--color-danger)',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <div style={inputWrapperStyle}>
        {icon && <span style={iconStyle}>{icon}</span>}
        <input
          {...rest}
          id={inputId}
          style={inputStyle}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};

export default Input;
