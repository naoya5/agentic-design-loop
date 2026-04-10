import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: () => void;
}

const ACCENT_COLORS: Record<TaskStatus, string> = {
  todo: 'var(--color-text-secondary)',
  in_progress: 'var(--color-accent)',
  review: 'var(--color-warning)',
  done: 'var(--color-success)',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onAddTask,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  const columnStyle: React.CSSProperties = {
    flex: '1 0 280px',
    minWidth: '280px',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-card)',
    minHeight: '200px',
    transition: 'all var(--transition)',
    border: isOver ? `2px dashed ${ACCENT_COLORS[status]}` : '2px solid transparent',
    backgroundColor: isOver ? 'rgba(232, 99, 74, 0.04)' : 'var(--color-surface)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderLeft: `4px solid ${ACCENT_COLORS[status]}`,
    borderTopLeftRadius: 'var(--radius-card)',
    borderTopRightRadius: 'var(--radius-card)',
  };

  const headerLeftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--color-text)',
    letterSpacing: '0.02em',
  };

  const countBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    borderRadius: 'var(--radius-pill)',
    background: ACCENT_COLORS[status],
    color: 'var(--color-on-accent)',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-data)',
  };

  const addButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: 'var(--radius-button)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  };

  const bodyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px 12px 12px',
    flex: 1,
    overflowY: 'auto',
  };

  return (
    <div style={columnStyle} ref={setNodeRef}>
      <div style={headerStyle}>
        <div style={headerLeftStyle}>
          <span style={titleStyle}>{STATUS_LABELS[status]}</span>
          <span style={countBadgeStyle}>{tasks.length}</span>
        </div>
        <button
          style={addButtonStyle}
          onClick={onAddTask}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-hover)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
          }}
          title={`Add task to ${STATUS_LABELS[status]}`}
        >
          <Plus size={16} />
        </button>
      </div>
      <div style={bodyStyle}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              opacity: 0.6,
            }}
          >
            No tasks
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
