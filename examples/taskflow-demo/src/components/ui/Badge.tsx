import React from 'react';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  color?: string;
  size?: BadgeSize;
}

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: { padding: '2px 8px', fontSize: '10px' },
  md: { padding: '4px 12px', fontSize: '12px' },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = 'var(--color-accent)',
  size = 'md',
}) => {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 'var(--radius-pill)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    background: `${color}18`,
    color: color,
    ...sizeStyles[size],
  };

  return <span style={style}>{label}</span>;
};

export default Badge;
