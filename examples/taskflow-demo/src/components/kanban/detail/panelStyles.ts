import React from 'react';
import type { TaskStatus, TaskPriority } from '../../../types';
import { PRIORITY_COLORS } from '../../../types';

export const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.2)',
  zIndex: 49,
};

export const panelStyle: React.CSSProperties = {
  position: 'fixed',
  right: 0,
  top: 0,
  width: '480px',
  height: '100vh',
  background: 'var(--color-panel-bg)',
  boxShadow: 'var(--shadow-xl)',
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  animation: 'slideInRight 250ms ease-out',
  overflowY: 'auto',
};

export const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '20px 24px 12px',
  gap: '12px',
  borderBottom: '1px solid var(--color-border)',
};

export const titleInputStyle: React.CSSProperties = {
  flex: 1,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: '18px',
  color: 'var(--color-text)',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  width: '100%',
  padding: '4px 0',
};

export const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  flexShrink: 0,
};

export const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: 'var(--radius-button)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
};

export const sectionStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderBottom: '1px solid var(--color-border)',
};

export const sectionTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '10px',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

export const statusBtnStyle = (s: TaskStatus, active: boolean): React.CSSProperties => {
  const accentMap: Record<TaskStatus, string> = {
    todo: 'var(--color-text-secondary)',
    in_progress: 'var(--color-accent)',
    review: 'var(--color-warning)',
    done: 'var(--color-success)',
  };
  return {
    padding: '6px 12px',
    borderRadius: 'var(--radius-pill)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? 'none' : '1px solid var(--color-border)',
    background: active ? accentMap[s] : 'transparent',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    transition: 'all var(--transition)',
  };
};

export const priorityBtnStyle = (p: TaskPriority, active: boolean): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: 'var(--radius-pill)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  border: active ? 'none' : '1px solid var(--color-border)',
  background: active ? PRIORITY_COLORS[p] : 'transparent',
  color: active ? '#fff' : PRIORITY_COLORS[p],
  transition: 'all var(--transition)',
});

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-button)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text)',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
};

export const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
  lineHeight: 1.5,
};

export const fieldRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  marginBottom: '12px',
};

export const fieldLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: '4px',
};
