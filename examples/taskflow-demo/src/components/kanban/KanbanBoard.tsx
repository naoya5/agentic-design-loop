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
import { useUIStore } from '../../stores/uiStore';
import type { Task, TaskStatus } from '../../types';
import { STATUS_COLUMNS } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskCreateModal } from './TaskCreateModal';
import { SwimlaneBoardView, type SwimlaneModeType } from './SwimlaneBoardView';
import { SwimlaneToolbar } from './SwimlaneToolbar';

export const KanbanBoard: React.FC = () => {
  const tasks = useTaskStore((s) => s.tasks);
  const moveTask = useTaskStore((s) => s.moveTask);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const filterPriority = useUIStore((s) => s.filterPriority);
  const filterAssignee = useUIStore((s) => s.filterAssignee);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>('todo');
  const [swimlaneMode, setSwimlaneMode] = useState<SwimlaneModeType>('none');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterAssignee && task.assignee_id !== filterAssignee) return false;
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterAssignee]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    filteredTasks.forEach((t) => {
      if (map[t.status]) {
        map[t.status].push(t);
      }
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => a.sort_order - b.sort_order)
    );
    return map;
  }, [filteredTasks]);

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

    const targetTasks = tasksByStatus[targetStatus];
    const newSortOrder = targetTasks.length > 0
      ? Math.max(...targetTasks.map((t) => t.sort_order)) + 1
      : 0;

    moveTask(taskId, targetStatus, newSortOrder);
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreateModalStatus(status);
    setCreateModalOpen(true);
  };

  // When a swimlane mode is active, delegate to SwimlaneBoardView
  if (swimlaneMode !== 'none') {
    return (
      <>
        <SwimlaneToolbar current={swimlaneMode} onChange={setSwimlaneMode} />
        <SwimlaneBoardView swimlaneMode={swimlaneMode} />
        {createModalOpen && (
          <TaskCreateModal
            defaultStatus={createModalStatus}
            onClose={() => setCreateModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <SwimlaneToolbar current={swimlaneMode} onChange={setSwimlaneMode} />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'flex',
          gap: '16px',
          padding: '16px',
          overflowX: 'auto',
          height: '100%',
          alignItems: 'flex-start',
        }}>
          {STATUS_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onAddTask={() => handleAddTask(status)}
            />
          ))}
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

export default KanbanBoard;
