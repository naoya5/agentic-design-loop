import React from 'react';
import type { Task } from '../../types';
import { Badge } from '../ui/Badge';
import { daysUntil } from '../../utils/relativeTime';
import { emptyMessageStyle } from './DashboardCard';

interface DeadlineAlertsProps {
  tasks: Task[];
}

export const DeadlineAlerts: React.FC<DeadlineAlertsProps> = ({ tasks }) => {
  const deadlineTasks = tasks
    .filter((t) => t.due_date && t.status !== 'done')
    .map((t) => {
      const days = daysUntil(t.due_date!);
      return { ...t, daysLeft: days };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8);

  if (deadlineTasks.length === 0) {
    return (
      <div style={emptyMessageStyle}>
        期限間近のタスクはありません
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
      {deadlineTasks.map((t) => {
        let badgeLabel = '';
        let badgeColor = '';
        if (t.daysLeft < 0) {
          badgeLabel = '期限切れ';
          badgeColor = 'var(--color-danger)';
        } else if (t.daysLeft === 0) {
          badgeLabel = '本日期限';
          badgeColor = 'var(--color-accent)';
        } else if (t.daysLeft <= 3) {
          badgeLabel = '間近';
          badgeColor = 'var(--color-warning)';
        }
        return (
          <div
            key={t.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: '6px',
              background: 'var(--color-bg)',
              fontSize: '13px', fontFamily: 'var(--font-data)',
            }}
          >
            <span style={{
              fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', maxWidth: '200px',
            }}>
              {t.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {t.due_date ? new Date(t.due_date).toLocaleDateString('ja-JP') : ''}
              </span>
              {badgeLabel && <Badge label={badgeLabel} color={badgeColor} size="sm" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
