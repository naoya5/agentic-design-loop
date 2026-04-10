import React, { useState } from 'react';
import { Link2, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskStore } from '../../../stores/taskStore';
import type { Task, TaskDependency } from '../../../types';
import { Button } from '../../ui/Button';
import { sectionStyle, sectionTitleStyle, selectStyle, iconBtnStyle } from './panelStyles';

interface TaskDependencySectionProps {
  task: Task;
  dependencies: TaskDependency[];
  tasks: Task[];
}

export const TaskDependencySection: React.FC<TaskDependencySectionProps> = ({
  task,
  dependencies,
  tasks,
}) => {
  const addDependency = useTaskStore((s) => s.addDependency);
  const removeDependency = useTaskStore((s) => s.removeDependency);
  const [depTaskId, setDepTaskId] = useState('');

  const availableTasks = tasks.filter(
    (t) =>
      t.id !== task.id &&
      !dependencies.some((d) => d.to_task_id === t.id && d.from_task_id === task.id)
  );

  const handleAdd = async () => {
    if (!depTaskId) return;
    try {
      await addDependency(task.id, depTaskId, 'FS');
      setDepTaskId('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add dependency';
      toast.error(message);
    }
  };

  const handleRemove = async (depId: string) => {
    try {
      await removeDependency(task.id, depId);
    } catch {
      // silent
    }
  };

  const depItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    borderRadius: 'var(--radius-button)',
    background: 'var(--color-input-bg)',
    marginBottom: '6px',
    fontSize: '12px',
  };

  return (
    <div style={sectionStyle}>
      <div style={sectionTitleStyle}>
        <Link2 size={12} />
        Dependencies
      </div>
      {dependencies.map((dep) => {
        const depTask = tasks.find((t) => t.id === dep.to_task_id);
        return (
          <div key={dep.id} style={depItemStyle}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
              <ChevronRight size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {depTask?.title || dep.to_task_id}
              <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px', fontSize: '10px' }}>
                ({dep.type})
              </span>
            </span>
            <button
              style={{ ...iconBtnStyle, width: '20px', height: '20px', color: 'var(--color-danger)' }}
              onClick={() => handleRemove(dep.id)}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
        <select
          style={{ ...selectStyle, flex: 1, fontSize: '12px' }}
          value={depTaskId}
          onChange={(e) => setDepTaskId(e.target.value)}
        >
          <option value="">Select task...</option>
          {availableTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <Button size="sm" variant="secondary" onClick={handleAdd} disabled={!depTaskId}>
          Add
        </Button>
      </div>
    </div>
  );
};
