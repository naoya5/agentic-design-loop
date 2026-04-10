import React from 'react';
import type { Task, Member } from '../../types';
import { emptyMessageStyle } from './DashboardCard';

interface MemberWorkloadProps {
  members: Member[];
  tasks: Task[];
}

export const MemberWorkload: React.FC<MemberWorkloadProps> = ({ members, tasks }) => {
  const memberWorkload = members.map((m) => ({
    name: m.name,
    count: tasks.filter((t) => t.assignee_id === m.id && t.status !== 'done').length,
    color: m.avatar_color,
  }));

  if (memberWorkload.length === 0) {
    return (
      <div style={emptyMessageStyle}>
        メンバーがいません
      </div>
    );
  }

  const maxCount = Math.max(...memberWorkload.map((x) => x.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {memberWorkload.map((m) => {
        const pct = (m.count / maxCount) * 100;
        return (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '12px', fontWeight: 500, width: '70px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {m.name}
            </span>
            <div style={{
              flex: 1, height: '18px', borderRadius: '4px',
              background: 'var(--color-surface)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${pct}%`, borderRadius: '4px',
                background: m.color || 'var(--color-accent)',
                transition: 'width 400ms ease',
                minWidth: m.count > 0 ? '8px' : '0',
              }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, width: '24px', textAlign: 'right' }}>
              {m.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};
