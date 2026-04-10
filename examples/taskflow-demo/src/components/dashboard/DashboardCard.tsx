import React from 'react';

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  gridSpan?: number;
}

export const dashboardCardStyle: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  borderRadius: '6px',
  boxShadow: 'var(--shadow-md)',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  transition: 'box-shadow 200ms',
};

export const dashboardCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--color-primary)',
  fontFamily: 'var(--font-data)',
};

export const emptyMessageStyle: React.CSSProperties = {
  textAlign: 'center',
  color: 'var(--color-text-secondary)',
  padding: '24px 0',
  fontSize: '13px',
};

export const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  children,
  gridSpan,
}) => {
  return (
    <div style={{ ...dashboardCardStyle, ...(gridSpan ? { gridColumn: `span ${gridSpan}` } : {}) }}>
      <div style={dashboardCardHeaderStyle}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
};
