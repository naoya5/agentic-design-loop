import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useMemberStore } from '../../stores/memberStore';
import { useTaskStore } from '../../stores/taskStore';
import type { Member } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import toast from 'react-hot-toast';

/* ── constants ── */

const PRESET_COLORS = [
  '#E8634A', '#5BAA8A', '#E8A838', '#C94040', '#1B2838',
  '#6B6B6B', '#7C5CFC', '#3B82F6', '#14B8A6', '#F97316',
  '#EC4899', '#8B5CF6',
];

const ROLE_OPTIONS = [
  { value: 'admin', label: '管理者' },
  { value: 'member', label: 'メンバー' },
  { value: 'viewer', label: '閲覧者' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: '#E8634A',
  member: '#5BAA8A',
  viewer: '#6B6B6B',
};

const ROLE_JP: Record<string, string> = {
  admin: '管理者',
  member: 'メンバー',
  viewer: '閲覧者',
};

/* ── styles ── */

const pageHeaderStyle: React.CSSProperties = {
  padding: '24px 24px 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-data)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--color-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '16px',
  padding: '24px',
  fontFamily: 'var(--font-data)',
};

const memberCardStyle: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  borderRadius: '6px',
  boxShadow: 'var(--shadow-md)',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  transition: 'box-shadow 200ms, transform 200ms',
  position: 'relative',
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

/* ── component ── */

interface MemberForm {
  name: string;
  email: string;
  role: string;
  avatar_color: string;
}

const emptyForm: MemberForm = { name: '', email: '', role: 'member', avatar_color: PRESET_COLORS[0] };

export const MembersPage: React.FC = () => {
  const { members, loading, fetchMembers, createMember, updateMember, deleteMember } = useMemberStore();
  const { tasks } = useTaskStore();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<MemberForm>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditingId(m.id);
    setForm({ name: m.name, email: m.email, role: m.role, avatar_color: m.avatar_color });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateMember(editingId, form);
      } else {
        await createMember(form);
      }
      setModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'メンバーの保存に失敗しました';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'メンバーの削除に失敗しました';
      toast.error(message);
    }
    setDeleteConfirmId(null);
  };

  const taskCount = (memberId: string) =>
    tasks.filter((t) => t.assignee_id === memberId).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div style={titleStyle}>
          <Users size={22} />
          メンバー管理
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreate}>
          メンバー追加
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title="メンバーがいません"
          description="チームメンバーを追加してタスクを割り当てましょう"
          actionLabel="メンバー追加"
          onAction={openCreate}
        />
      ) : (
        <div style={gridStyle}>
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                ...memberCardStyle,
                boxShadow: hovered === m.id
                  ? 'var(--shadow-lg)'
                  : 'var(--shadow-md)',
                transform: hovered === m.id ? 'translateY(-2px)' : 'none',
              }}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => openEdit(m)}
            >
              {/* delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(m.id); }}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '6px',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,64,64,0.08)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }}
                title="削除"
              >
                <Trash2 size={14} />
              </button>

              <Avatar name={m.name} color={m.avatar_color} size="lg" />
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)' }}>
                {m.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{m.email}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge label={ROLE_JP[m.role] || m.role} color={ROLE_COLORS[m.role] || '#6B6B6B'} size="sm" />
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {taskCount(m.id)} タスク
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'メンバー編集' : 'メンバー追加'}
        size="sm"
      >
        <div style={formGroupStyle}>
          <Input
            label="名前"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="山田太郎"
          />
          <Input
            label="メール"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="taro@example.com"
          />
          <Select
            label="ロール"
            value={form.role}
            onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            options={ROLE_OPTIONS}
          />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', fontFamily: 'var(--font-data)' }}>
              アバターカラー
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, avatar_color: c }))}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: c,
                    border: form.avatar_color === c ? '3px solid var(--color-primary)' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 200ms',
                    boxShadow: form.avatar_color === c ? '0 0 0 2px var(--color-inset-shadow) inset' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="primary" size="sm"
              loading={submitting}
              onClick={handleSubmit}
              disabled={!form.name.trim()}
            >
              {editingId ? '更新' : '作成'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="メンバー削除"
        size="sm"
      >
        <div style={{ fontFamily: 'var(--font-data)' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '20px' }}>
            このメンバーを削除しますか？ この操作は取り消せません。
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmId(null)}>
              キャンセル
            </Button>
            <Button
              variant="danger" size="sm"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              削除する
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MembersPage;
