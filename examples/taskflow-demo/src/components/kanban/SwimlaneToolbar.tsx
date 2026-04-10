import React from 'react';
import { Users, BarChart3, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SwimlaneModeType } from './SwimlaneBoardView';

interface SwimlaneToolbarProps {
  current: SwimlaneModeType;
  onChange: (mode: SwimlaneModeType) => void;
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 10px',
  borderRadius: 'var(--radius-button)',
  border: '1px solid var(--color-border)',
  background: active ? 'var(--color-accent)' : 'transparent',
  color: active ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all var(--transition)',
});

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  padding: '8px 16px',
  borderBottom: '1px solid var(--color-border)',
  alignItems: 'center',
};

const MODES: { mode: SwimlaneModeType; icon: LucideIcon; label: string }[] = [
  { mode: 'none', icon: LayoutGrid, label: '通常' },
  { mode: 'assignee', icon: Users, label: '担当者別' },
  { mode: 'priority', icon: BarChart3, label: '優先度別' },
];

export const SwimlaneToolbar: React.FC<SwimlaneToolbarProps> = ({ current, onChange }) => {
  return (
    <div style={toolbarStyle}>
      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '8px' }}>
        スイムレーン:
      </span>
      {MODES.map(({ mode, icon: Icon, label }) => (
        <button key={mode} style={btnStyle(current === mode)} onClick={() => onChange(mode)}>
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  );
};
