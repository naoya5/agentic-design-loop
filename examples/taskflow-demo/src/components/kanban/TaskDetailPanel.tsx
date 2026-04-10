import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskStore } from '../../stores/taskStore';
import { useMemberStore } from '../../stores/memberStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import type { TaskStatus, TaskPriority } from '../../types';
import {
  STATUS_LABELS,
  STATUS_COLUMNS,
  PRIORITY_LABELS,
} from '../../types';
import { TaskCommentSection } from './detail/TaskCommentSection';
import { TaskDependencySection } from './detail/TaskDependencySection';
import { TaskAIDecomposeSection } from './detail/TaskAIDecomposeSection';
import { TaskFieldsSection } from './detail/TaskFieldsSection';
import {
  overlayStyle,
  panelStyle,
  headerStyle,
  titleInputStyle,
  headerActionsStyle,
  iconBtnStyle,
  sectionStyle,
  sectionTitleStyle,
  statusBtnStyle,
  priorityBtnStyle,
  textareaStyle,
} from './detail/panelStyles';

const DEBOUNCE_MS = 600;

export const TaskDetailPanel: React.FC = () => {
  const task = useTaskStore((s) => s.selectedTask());
  const tasks = useTaskStore((s) => s.tasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const dependencies = useTaskStore((s) => s.dependencies);
  const fetchDependencies = useTaskStore((s) => s.fetchDependencies);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const taskDetailOpen = useUIStore((s) => s.taskDetailOpen);
  const setTaskDetailOpen = useUIStore((s) => s.setTaskDetailOpen);
  const members = useMemberStore((s) => s.members);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStartDate(task.start_date || '');
      setDueDate(task.due_date || '');
      setEstimatedHours(task.estimated_hours != null ? String(task.estimated_hours) : '');
      fetchDependencies(task.id);
    }
  }, [task?.id]);

  const autoSave = useCallback(
    (field: string, value: string | number | null) => {
      if (!task) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateTask(task.id, { [field]: value });
      }, DEBOUNCE_MS);
    },
    [task, updateTask]
  );

  const handleStatusChange = (status: TaskStatus) => {
    if (!task) return;
    updateTask(task.id, { status });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    if (!task) return;
    updateTask(task.id, { priority });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    if (!task) return;
    updateTask(task.id, { assignee_id: assigneeId || null });
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    autoSave('title', val);
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    autoSave('description', val);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    updateTask(task!.id, { start_date: val || null });
  };

  const handleDueDateChange = (val: string) => {
    setDueDate(val);
    updateTask(task!.id, { due_date: val || null });
  };

  const handleEstimatedHoursChange = (val: string) => {
    setEstimatedHours(val);
    autoSave('estimated_hours', val ? parseFloat(val) : null);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!window.confirm('このタスクを削除しますか？')) return;
    try {
      await deleteTask(task.id);
      setTaskDetailOpen(false);
      toast.success('タスクを削除しました');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    }
  };

  const handleClose = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      if (task) {
        if (title !== task.title) updateTask(task.id, { title });
        if (description !== (task.description || '')) updateTask(task.id, { description });
      }
    }
    setSelectedTask(null);
    setTaskDetailOpen(false);
  };

  if (!task || !taskDetailOpen) return null;

  const slideInKeyframes = `
  @keyframes slideInRight {
    from { transform: translateX(480px); }
    to { transform: translateX(0); }
  }`;

  return (
    <>
      <style>{slideInKeyframes}</style>
      <div style={overlayStyle} onClick={handleClose} />
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <input
            style={titleInputStyle}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Task title"
          />
          <div style={headerActionsStyle}>
            <button
              style={{ ...iconBtnStyle, color: 'var(--color-danger)' }}
              onClick={handleDelete}
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
            <button style={iconBtnStyle} onClick={handleClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Status</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUS_COLUMNS.map((s) => (
              <button
                key={s}
                style={statusBtnStyle(s, task.status === s)}
                onClick={() => handleStatusChange(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Priority</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
              <button
                key={p}
                style={priorityBtnStyle(p, task.priority === p)}
                onClick={() => handlePriorityChange(p)}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <TaskFieldsSection
          task={task}
          members={members}
          startDate={startDate}
          dueDate={dueDate}
          estimatedHours={estimatedHours}
          onAssigneeChange={handleAssigneeChange}
          onStartDateChange={handleStartDateChange}
          onDueDateChange={handleDueDateChange}
          onEstimatedHoursChange={handleEstimatedHoursChange}
        />

        {/* Description */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Description</div>
          <textarea
            style={textareaStyle}
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add description..."
          />
        </div>

        {/* Dependencies */}
        <TaskDependencySection
          task={task}
          dependencies={dependencies}
          tasks={tasks}
        />

        {/* Comments */}
        <TaskCommentSection taskId={task.id} />

        {/* AI Decompose */}
        {currentProjectId && (
          <TaskAIDecomposeSection task={task} projectId={currentProjectId} />
        )}
      </div>
    </>
  );
};

export default TaskDetailPanel;
