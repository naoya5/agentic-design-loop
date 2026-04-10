import React from 'react';
import {
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Activity,
} from 'lucide-react';
import type { ActivityLog } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { relativeTime } from '../../utils/relativeTime';
import { emptyMessageStyle } from './DashboardCard';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  task_created: <CheckCircle2 size={14} />,
  task_updated: <TrendingUp size={14} />,
  task_moved: <Activity size={14} />,
  task_deleted: <AlertTriangle size={14} />,
  comment_added: <Clock size={14} />,
};

interface RecentActivityProps {
  activityLogs: ActivityLog[];
  loading: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activityLogs, loading }) => {
  if (loading) return <LoadingSpinner size={20} />;

  if (activityLogs.length === 0) {
    return (
      <div style={emptyMessageStyle}>
        アクティビティがありません
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
      {activityLogs.map((log) => (
        <div
          key={log.id}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            padding: '8px 10px', borderRadius: '6px',
            background: 'var(--color-bg)',
            fontSize: '12px', fontFamily: 'var(--font-data)',
          }}
        >
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--color-surface)',
            color: 'var(--color-primary)', flexShrink: 0, marginTop: '1px',
          }}>
            {ACTION_ICONS[log.action] || <Activity size={14} />}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>
              <span style={{ fontWeight: 600 }}>{log.member_name || '不明'}</span>
              {' '}
              <span style={{ color: 'var(--color-text-secondary)' }}>{log.detail || log.action}</span>
            </div>
            {log.task_title && (
              <div style={{ color: 'var(--color-accent)', fontWeight: 500, marginTop: '2px' }}>
                {log.task_title}
              </div>
            )}
          </div>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {relativeTime(log.created_at)}
          </span>
        </div>
      ))}
    </div>
  );
};
