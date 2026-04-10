import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../api';
import type { Comment } from '../../../types';
import { Button } from '../../ui/Button';
import { sectionStyle, sectionTitleStyle, inputStyle, iconBtnStyle } from './panelStyles';

interface TaskCommentSectionProps {
  taskId: string;
}

export const TaskCommentSection: React.FC<TaskCommentSectionProps> = ({ taskId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const data = await api.getComments(taskId);
      setComments(data);
    } catch {
      // silent
    }
  };

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const comment = await api.createComment({
        task_id: taskId,
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add comment';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silent
    }
  };

  const commentItemStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    padding: '8px',
    borderRadius: 'var(--radius-card)',
    background: 'var(--color-input-bg)',
  };

  const commentAvatarStyle = (color?: string): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: color || 'var(--color-text-secondary)',
    color: 'var(--color-on-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 600,
    flexShrink: 0,
    marginTop: '2px',
  });

  return (
    <div style={sectionStyle}>
      <div style={sectionTitleStyle}>
        <MessageSquare size={12} />
        Comments ({comments.length})
      </div>
      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
        {comments.map((c) => (
          <div key={c.id} style={commentItemStyle}>
            <div style={commentAvatarStyle(c.member_color)}>
              {(c.member_name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-text)' }}>{c.member_name || 'Unknown'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-data)' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <button
                    style={{ ...iconBtnStyle, width: '16px', height: '16px' }}
                    onClick={() => handleDelete(c.id)}
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '12px', lineHeight: 1.5, wordBreak: 'break-word', color: 'var(--color-text)' }}>{c.content}</div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', padding: '8px 0' }}>
            No comments yet
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          style={{ ...inputStyle, minHeight: '40px', flex: 1, resize: 'none', fontSize: '12px' }}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleAdd();
            }
          }}
        />
        <Button
          size="sm"
          variant="primary"
          icon={<Send size={12} />}
          onClick={handleAdd}
          loading={loading}
          disabled={!newComment.trim()}
        />
      </div>
    </div>
  );
};
