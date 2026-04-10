import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const spinnerKeyframes = `
@keyframes loading-spin {
  to { transform: rotate(360deg); }
}
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  color = 'var(--color-accent)',
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const spinnerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    border: `2.5px solid var(--color-border)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'loading-spin 700ms linear infinite',
  };

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <div style={containerStyle}>
        <div style={spinnerStyle} />
      </div>
    </>
  );
};

export default LoadingSpinner;
