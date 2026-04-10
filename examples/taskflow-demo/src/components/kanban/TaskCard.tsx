import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Calendar } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import type { Task } from '../../types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../types';

interface TaskCardProps {
  task: Task;
  isDragOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, isDragOverlay = false }) => {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const setTaskDetailOpen = useUIStore((s) => s.setTaskDetailOpen);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: isDragOverlay,
  });

  const isOverdue = task.due_date
    ? new Date(task.due_date) < new Date() && task.status !== 'done'
    : false;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragOverlay) return;
    e.stopPropagation();
    setSelectedTask(task.id);
    setTaskDetailOpen(true);
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    borderRadius: 'var(--radius-card)',
    padding: '12px',
    boxShadow: isDragOverlay ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.4 : 1,
    borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
    transition: isDragOverlay ? 'none' : 'box-shadow var(--transition), opacity var(--transition)',
    animation: isDragOverlay ? 'none' : 'fadeIn 200ms ease-out',
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--color-text)',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '6px',
  };

  const descStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.4,
    marginBottom: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  };

  const priorityBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 500,
    color: PRIORITY_COLORS[task.priority],
    padding: '2px 6px',
    borderRadius: 'var(--radius-pill)',
    background: `${PRIORITY_COLORS[task.priority]}14`,
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: PRIORITY_COLORS[task.priority],
  };

  const dateStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '10px',
    fontFamily: 'var(--font-data)',
    color: isOverdue ? 'var(--color-danger)' : 'var(--color-text-secondary)',
    fontWeight: isOverdue ? 600 : 400,
  };

  const avatarStyle: React.CSSProperties = {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: task.assignee_color || 'var(--color-text-secondary)',
    color: 'var(--color-on-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 600,
    flexShrink: 0,
  };

  const metaLeftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    minWidth: 0,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isDragOverlay) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragOverlay) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      <div style={titleStyle}>{task.title}</div>

      {task.description && (
        <div style={descStyle}>
          {task.description.length > 60
            ? task.description.slice(0, 60) + '...'
            : task.description}
        </div>
      )}

      <div style={footerStyle}>
        <div style={metaLeftStyle}>
          <span style={priorityBadgeStyle}>
            <span style={dotStyle} />
            {PRIORITY_LABELS[task.priority]}
          </span>

          {task.due_date && (
            <span style={dateStyle}>
              <Calendar size={10} />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {task.assignee_name && (
          <div style={avatarStyle} title={task.assignee_name}>
            {task.assignee_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
