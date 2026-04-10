import React from 'react';

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  id,
  rows = 4,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);
  const textareaId = id || React.useId();

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

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-card)',
    border: `1px solid ${error ? 'var(--color-danger)' : focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
    background: 'var(--color-bg)',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    outline: 'none',
    resize: 'vertical',
    transition: 'all var(--transition)',
    boxShadow: focused ? '0 0 0 3px rgba(232, 99, 74, 0.12)' : 'none',
    lineHeight: 1.6,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--color-danger)',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label htmlFor={textareaId} style={labelStyle}>
          {label}
        </label>
      )}
      <textarea
        {...rest}
        id={textareaId}
        rows={rows}
        style={textareaStyle}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
};

export default Textarea;
