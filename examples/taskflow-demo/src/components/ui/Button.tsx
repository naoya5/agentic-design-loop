import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: '12px', gap: '4px' },
  md: { padding: '8px 16px', fontSize: '14px', gap: '6px' },
  lg: { padding: '12px 24px', fontSize: '16px', gap: '8px' },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
    border: 'none',
  },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--color-danger)',
    color: 'var(--color-on-accent)',
    border: 'none',
  },
};

const spinnerKeyframes = `
@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  children,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) => {
  const [hovered, setHovered] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    borderRadius: 'var(--radius-button)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition)',
    outline: 'none',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  if (hovered && !disabled && !loading) {
    if (variant === 'primary') {
      baseStyle.filter = 'brightness(0.9)';
    } else if (variant === 'secondary') {
      baseStyle.filter = 'brightness(1.05)';
    } else if (variant === 'ghost') {
      baseStyle.background = 'var(--color-hover)';
    } else if (variant === 'danger') {
      baseStyle.filter = 'brightness(0.9)';
    }
  }

  const spinnerStyle: React.CSSProperties = {
    width: size === 'sm' ? '12px' : size === 'lg' ? '18px' : '14px',
    height: size === 'sm' ? '12px' : size === 'lg' ? '18px' : '14px',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'btn-spin 600ms linear infinite',
  };

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <button
        {...rest}
        disabled={disabled || loading}
        style={baseStyle}
        onMouseEnter={(e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }}
      >
        {loading ? (
          <span style={spinnerStyle} />
        ) : icon ? (
          <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </button>
    </>
  );
};

export default Button;
