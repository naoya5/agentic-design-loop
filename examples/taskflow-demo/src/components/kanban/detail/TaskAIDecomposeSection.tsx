import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskStore } from '../../../stores/taskStore';
import { api } from '../../../api';
import type { Task, AIDecomposeResult } from '../../../types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../../types';
import { Button } from '../../ui/Button';
import { sectionStyle, sectionTitleStyle } from './panelStyles';

interface TaskAIDecomposeSectionProps {
  task: Task;
  projectId: string;
}

export const TaskAIDecomposeSection: React.FC<TaskAIDecomposeSectionProps> = ({ task, projectId }) => {
  const createTask = useTaskStore((s) => s.createTask);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AIDecomposeResult[]>([]);

  const handleDecompose = async () => {
    setLoading(true);
    try {
      const result = await api.aiDecompose({
        task_title: task.title,
        task_description: task.description,
      });
      setResults(result.subtasks || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI decomposition failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubtask = async (sub: AIDecomposeResult) => {
    try {
      await createTask({
        project_id: projectId,
        title: sub.title,
        description: sub.description,
        priority: sub.priority,
        estimated_hours: sub.estimated_hours,
        status: 'todo',
        parent_task_id: task.id,
      });
      toast.success(`Subtask "${sub.title}" created`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create subtask';
      toast.error(message);
    }
  };

  const aiCardStyle: React.CSSProperties = {
    padding: '10px',
    borderRadius: 'var(--radius-card)',
    border: '1px solid var(--color-border)',
    marginBottom: '8px',
    background: 'var(--color-input-bg)',
  };

  return (
    <div style={{ ...sectionStyle, borderBottom: 'none' }}>
      <div style={sectionTitleStyle}>
        <Sparkles size={12} />
        AI Decompose
      </div>
      <Button
        size="sm"
        variant="secondary"
        icon={<Sparkles size={14} />}
        onClick={handleDecompose}
        loading={loading}
      >
        Decompose into subtasks
      </Button>

      {results.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {results.map((sub, i) => (
            <div key={i} style={aiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', flex: 1, marginRight: '8px', color: 'var(--color-text)' }}>
                  {sub.title}
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleCreateSubtask(sub)}
                >
                  Create
                </Button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                {sub.description}
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                <span style={{ color: PRIORITY_COLORS[sub.priority], fontWeight: 500 }}>
                  {PRIORITY_LABELS[sub.priority]}
                </span>
                {sub.estimated_hours > 0 && (
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {sub.estimated_hours}h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
