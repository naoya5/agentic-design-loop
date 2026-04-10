import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  color?: string;
  size?: AvatarSize;
}

const sizePx: Record<AvatarSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

const fontSizes: Record<AvatarSize, string> = {
  sm: '11px',
  md: '13px',
  lg: '16px',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  color = 'var(--color-accent)',
  size = 'md',
}) => {
  const px = sizePx[size];
  const initial = name.charAt(0).toUpperCase();

  const style: React.CSSProperties = {
    width: `${px}px`,
    height: `${px}px`,
    borderRadius: '50%',
    background: color,
    color: 'var(--color-on-accent)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fontSizes[size],
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    lineHeight: 1,
    flexShrink: 0,
    textTransform: 'uppercase',
    userSelect: 'none',
  };

  return (
    <div style={style} title={name}>
      {initial}
    </div>
  );
};

export default Avatar;
