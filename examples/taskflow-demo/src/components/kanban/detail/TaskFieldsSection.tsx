import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import type { Task, Member } from '../../../types';
import { sectionStyle, inputStyle, selectStyle, fieldRowStyle, fieldLabelStyle } from './panelStyles';

interface TaskFieldsSectionProps {
  task: Task;
  members: Member[];
  startDate: string;
  dueDate: string;
  estimatedHours: string;
  onAssigneeChange: (id: string) => void;
  onStartDateChange: (val: string) => void;
  onDueDateChange: (val: string) => void;
  onEstimatedHoursChange: (val: string) => void;
}

export const TaskFieldsSection: React.FC<TaskFieldsSectionProps> = ({
  task,
  members,
  startDate,
  dueDate,
  estimatedHours,
  onAssigneeChange,
  onStartDateChange,
  onDueDateChange,
  onEstimatedHoursChange,
}) => {
  return (
    <div style={sectionStyle}>
      <div style={{ marginBottom: '12px' }}>
        <div style={fieldLabelStyle}>Assignee</div>
        <select
          style={selectStyle}
          value={task.assignee_id || ''}
          onChange={(e) => onAssigneeChange(e.target.value)}
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldRowStyle}>
        <div>
          <div style={fieldLabelStyle}>
            <Calendar size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Start Date
          </div>
          <input
            style={inputStyle}
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div>
          <div style={fieldLabelStyle}>
            <Calendar size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Due Date
          </div>
          <input
            style={inputStyle}
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div style={fieldLabelStyle}>
          <Clock size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Estimated Hours
        </div>
        <input
          style={{ ...inputStyle, width: '120px' }}
          type="number"
          min="0"
          step="0.5"
          value={estimatedHours}
          onChange={(e) => onEstimatedHoursChange(e.target.value)}
          placeholder="0"
        />
      </div>
    </div>
  );
};
