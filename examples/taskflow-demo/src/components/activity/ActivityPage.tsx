import React from 'react';
import {
  Activity, CheckCircle2, TrendingUp, AlertTriangle,
  MessageSquare, Filter, ChevronDown,
} from 'lucide-react';
import { api } from '../../api';
import { useProjectStore } from '../../stores/projectStore';
import type { ActivityLog } from '../../types';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { relativeTime } from '../../utils/relativeTime';
import toast from 'react-hot-toast';

/* ── helpers ── */

const ACTION_ICON_MAP: Record<string, React.ReactNode> = {
  task_created: <CheckCircle2 size={16} />,
  task_updated: <TrendingUp size={16} />,
  task_moved: <Activity size={16} />,
  task_deleted: <AlertTriangle size={16} />,
  comment_added: <MessageSquare size={16} />,
};

const ACTION_COLOR_MAP: Record<string, string> = {
  task_created: 'var(--color-success)',
  task_updated: 'var(--color-accent)',
  task_moved: '#3B82F6',
  task_deleted: 'var(--color-danger)',
  comment_added: 'var(--color-warning)',
};

const ACTION_LABEL_MAP: Record<string, string> = {
  task_created: 'タスク作成',
  task_updated: 'タスク更新',
  task_moved: 'ステータス変更',
  task_deleted: 'タスク削除',
  comment_added: 'コメント追加',
};

const FILTER_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: 'task_created', label: 'タスク作成' },
  { value: 'task_updated', label: 'タスク更新' },
  { value: 'task_moved', label: 'ステータス変更' },
  { value: 'task_deleted', label: 'タスク削除' },
  { value: 'comment_added', label: 'コメント追加' },
];

/* ── styles ── */

const pageHeaderStyle: React.CSSProperties = {
  padding: '24px 24px 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-data)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--color-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const timelineContainer: React.CSSProperties = {
  padding: '24px 24px 24px 48px',
  position: 'relative',
  fontFamily: 'var(--font-data)',
};

const timelineLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: '35px',
  top: '0',
  bottom: '0',
  width: '2px',
  background: 'var(--color-surface)',
};

const filterWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
};

const filterSelectStyle: React.CSSProperties = {
  appearance: 'none',
  padding: '6px 32px 6px 12px',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  fontSize: '13px',
  fontFamily: 'var(--font-data)',
  color: 'var(--color-text)',
  cursor: 'pointer',
  outline: 'none',
  transition: 'all 200ms',
};

/* ── component ── */

export const ActivityPage: React.FC = () => {
  const [logs, setLogs] = React.useState<ActivityLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [filterAction, setFilterAction] = React.useState('');
  const [limit, setLimit] = React.useState(20);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);

  const fetchLogs = React.useCallback(async (lim: number) => {
    try {
      const data = await api.getActivity(currentProjectId || '', lim);
      setLogs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'アクティビティの取得に失敗しました';
      toast.error(message);
    }
  }, [currentProjectId]);

  React.useEffect(() => {
    setLoading(true);
    fetchLogs(limit).finally(() => setLoading(false));
  }, [fetchLogs, limit]);

  const loadMore = async () => {
    setLoadingMore(true);
    const newLimit = limit + 20;
    setLimit(newLimit);
    await fetchLogs(newLimit);
    setLoadingMore(false);
  };

  const filteredLogs = filterAction
    ? logs.filter((l) => l.action === filterAction)
    : logs;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div style={titleStyle}>
          <Activity size={22} />
          アクティビティ
        </div>
        <div style={filterWrapperStyle}>
          <Filter size={14} style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-secondary)', pointerEvents: 'none', zIndex: 1,
          }} />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ ...filterSelectStyle, paddingLeft: '30px' }}
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-secondary)', pointerEvents: 'none',
          }} />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<Activity size={40} />}
          title="アクティビティがありません"
          description="プロジェクトの活動が記録されるとここに表示されます"
        />
      ) : (
        <div style={timelineContainer}>
          <div style={timelineLineStyle} />

          {filteredLogs.map((log, index) => {
            const actionColor = ACTION_COLOR_MAP[log.action] || 'var(--color-text-secondary)';
            return (
              <div
                key={log.id}
                style={{
                  position: 'relative',
                  marginBottom: '16px',
                  paddingLeft: '24px',
                  animation: `timeline-fade-in 300ms ease ${index * 30}ms both`,
                }}
              >
                {/* dot */}
                <div style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '8px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${actionColor}18`,
                  border: `2px solid ${actionColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: actionColor,
                  zIndex: 1,
                }}>
                  {ACTION_ICON_MAP[log.action] || <Activity size={16} />}
                </div>

                {/* card */}
                <div style={{
                  background: 'var(--color-card-bg)',
                  borderRadius: '6px',
                  boxShadow: 'var(--shadow-md)',
                  padding: '14px 18px',
                  marginLeft: '12px',
                  transition: 'box-shadow 200ms',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {log.member_name || '不明'}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: `${actionColor}18`,
                        color: actionColor,
                        fontWeight: 600,
                      }}>
                        {ACTION_LABEL_MAP[log.action] || log.action}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {relativeTime(log.created_at)}
                    </span>
                  </div>

                  {log.detail && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {log.detail}
                    </div>
                  )}

                  {log.task_title && (
                    <div style={{
                      fontSize: '12px', color: 'var(--color-accent)',
                      fontWeight: 500, marginTop: '4px',
                    }}>
                      {log.task_title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* load more */}
          <div style={{ textAlign: 'center', paddingTop: '8px', paddingLeft: '12px' }}>
            <Button
              variant="secondary" size="sm"
              loading={loadingMore}
              onClick={loadMore}
            >
              さらに読み込む
            </Button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes timeline-fade-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ActivityPage;
