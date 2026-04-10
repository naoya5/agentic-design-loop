import React from 'react';
import type { Task, TaskStatus } from '../../types';

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'var(--color-text-secondary)',
  in_progress: 'var(--color-accent)',
  review: 'var(--color-warning)',
  done: 'var(--color-success)',
};

const STATUS_JP: Record<TaskStatus, string> = {
  todo: '未着手',
  in_progress: '進行中',
  review: 'レビュー',
  done: '完了',
};

interface ProgressOverviewProps {
  tasks: Task[];
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({ tasks }) => {
  const total = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const donePercent = total > 0 ? Math.round((doneTasks.length / total) * 100) : 0;

  const donutRadius = 54;
  const donutStroke = 10;
  const circumference = 2 * Math.PI * donutRadius;
  const dashOffset = circumference - (donePercent / 100) * circumference;

  const statRows: { label: string; value: number; color: string }[] = [
    { label: '合計', value: total, color: 'var(--color-text-secondary)' },
    { label: '完了', value: doneTasks.length, color: STATUS_COLORS.done },
    { label: '進行中', value: inProgress.length, color: STATUS_COLORS.in_progress },
    { label: '未着手', value: todoTasks.length, color: STATUS_COLORS.todo },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle
          cx="65" cy="65" r={donutRadius}
          fill="none" stroke="var(--color-surface)" strokeWidth={donutStroke}
        />
        <circle
          cx="65" cy="65" r={donutRadius}
          fill="none" stroke="var(--color-success)" strokeWidth={donutStroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
        <text x="65" y="62" textAnchor="middle" fontSize="24" fontWeight="700"
          fill="var(--color-primary)" fontFamily="var(--font-data)">
          {donePercent}%
        </text>
        <text x="65" y="80" textAnchor="middle" fontSize="11"
          fill="var(--color-text-secondary)" fontFamily="var(--font-data)">
          完了
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
        {statRows.map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ color: row.color }}>{row.label}</span>
            <span style={{ fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
