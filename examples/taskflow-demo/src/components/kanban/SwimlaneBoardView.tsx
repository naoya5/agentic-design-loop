import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useTaskStore } from '../../stores/taskStore';
import { useMemberStore } from '../../stores/memberStore';
import { useUIStore } from '../../stores/uiStore';
import type { Task, TaskStatus, TaskPriority } from '../../types';
import { STATUS_COLUMNS, STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskCreateModal } from './TaskCreateModal';

export type SwimlaneModeType = 'none' | 'assignee' | 'priority';

interface SwimlaneGroup {
  key: string;
  label: string;
  color?: string;
  tasks: Task[];
}

interface SwimlaneBoardViewProps {
  swimlaneMode: SwimlaneModeType;
}

export const SwimlaneBoardView: React.FC<SwimlaneBoardViewProps> = ({ swimlaneMode }) => {
  const tasks = useTaskStore((s) => s.tasks);
  const moveTask = useTaskStore((s) => s.moveTask);
  const members = useMemberStore((s) => s.members);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const filterPriority = useUIStore((s) => s.filterPriority);
  const filterAssignee = useUIStore((s) => s.filterAssignee);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>('todo');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(q) && !task.description?.toLowerCase().includes(q)) return false;
      }
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterAssignee && task.assignee_id !== filterAssignee) return false;
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterAssignee]);

  const swimlaneGroups: SwimlaneGroup[] = useMemo(() => {
    if (swimlaneMode === 'assignee') {
      const memberGroups: SwimlaneGroup[] = members.map((m) => ({
        key: m.id,
        label: m.name,
        color: m.avatar_color,
        tasks: filteredTasks.filter((t) => t.assignee_id === m.id),
      }));
      const unassigned: SwimlaneGroup = {
        key: 'unassigned',
        label: '未割り当て',
        tasks: filteredTasks.filter((t) => !t.assignee_id),
      };
      return [...memberGroups.filter((g) => g.tasks.length > 0), ...(unassigned.tasks.length > 0 ? [unassigned] : [])];
    }

    if (swimlaneMode === 'priority') {
      const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
      return priorities
        .map((p) => ({
          key: p,
          label: PRIORITY_LABELS[p],
          color: PRIORITY_COLORS[p],
          tasks: filteredTasks.filter((t) => t.priority === p),
        }))
        .filter((g) => g.tasks.length > 0);
    }

    return [{ key: 'all', label: '', tasks: filteredTasks }];
  }, [swimlaneMode, filteredTasks, members]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as TaskStatus;
    if (!STATUS_COLUMNS.includes(targetStatus)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    const targetTasks = filteredTasks.filter((t) => t.status === targetStatus);
    const newSortOrder = targetTasks.length > 0
      ? Math.max(...targetTasks.map((t) => t.sort_order)) + 1
      : 0;
    moveTask(taskId, targetStatus, newSortOrder);
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreateModalStatus(status);
    setCreateModalOpen(true);
  };

  const laneHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-card)',
    marginBottom: '8px',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--color-text)',
    borderLeft: '4px solid var(--color-accent)',
  };

  const containerStyle: React.CSSProperties = {
    padding: '16px',
    height: '100%',
    overflowY: 'auto',
  };

  const columnsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    alignItems: 'flex-start',
    minHeight: '200px',
  };

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={containerStyle}>
          {swimlaneGroups.map((group) => {
            const tasksByStatus: Record<TaskStatus, Task[]> = {
              todo: [], in_progress: [], review: [], done: [],
            };
            group.tasks.forEach((t) => {
              if (tasksByStatus[t.status]) tasksByStatus[t.status].push(t);
            });
            Object.values(tasksByStatus).forEach((arr) =>
              arr.sort((a, b) => a.sort_order - b.sort_order)
            );

            return (
              <div key={group.key} style={{ marginBottom: '24px' }}>
                {group.label && (
                  <div style={{ ...laneHeaderStyle, borderLeftColor: group.color || 'var(--color-accent)' }}>
                    {group.color && (
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: group.color, flexShrink: 0,
                      }} />
                    )}
                    {group.label}
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-data)' }}>
                      ({group.tasks.length})
                    </span>
                  </div>
                )}
                <div style={columnsStyle}>
                  {STATUS_COLUMNS.map((status) => (
                    <KanbanColumn
                      key={`${group.key}-${status}`}
                      status={status}
                      tasks={tasksByStatus[status]}
                      onAddTask={() => handleAddTask(status)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {createModalOpen && (
        <TaskCreateModal
          defaultStatus={createModalStatus}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </>
  );
};
