import React, { useState } from 'react';
import {
  FolderKanban,
  LayoutDashboard,
  Users,
  Activity,
  Plus,
  Trash2,
  GanttChart as GanttIcon,
  Sparkles,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

const NAV_ITEMS = [
  { view: 'kanban' as const, icon: FolderKanban, label: 'カンバン' },
  { view: 'gantt' as const, icon: GanttIcon, label: 'ガントチャート' },
  { view: 'dashboard' as const, icon: LayoutDashboard, label: 'ダッシュボード' },
  { view: 'members' as const, icon: Users, label: 'メンバー' },
  { view: 'activity' as const, icon: Activity, label: 'アクティビティ' },
];

export const Sidebar: React.FC = () => {
  const { projects, currentProjectId, setCurrentProject, createProject, deleteProject } =
    useProjectStore();
  const { currentView, setView, sidebarOpen } = useUIStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const p = await createProject({ name: newProjectName.trim() });
    setCurrentProject(p.id);
    setNewProjectName('');
    setShowNewProject(false);
  };

  if (!sidebarOpen) return null;

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--color-sidebar-bg)',
        color: 'var(--color-sidebar-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width var(--transition)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--color-sidebar-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-on-accent)',
            }}
          >
            T
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--color-sidebar-text)' }}>TaskFlow</span>
        </div>
      </div>

      {/* Projects */}
      <div style={{ padding: '16px 12px 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-sidebar-text-muted)', letterSpacing: '0.5px' }}>
            プロジェクト
          </span>
          <button
            onClick={() => setShowNewProject(true)}
            style={{
              background: 'var(--color-sidebar-border)',
              border: 'none',
              borderRadius: 4,
              padding: '2px 4px',
              cursor: 'pointer',
              color: 'var(--color-sidebar-text)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        {showNewProject && (
          <div style={{ padding: '4px 8px', marginBottom: 8 }}>
            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') {
                  setShowNewProject(false);
                  setNewProjectName('');
                }
              }}
              placeholder="プロジェクト名"
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid rgba(232, 226, 217, 0.2)',
                background: 'var(--color-sidebar-border)',
                color: 'var(--color-sidebar-text)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setCurrentProject(project.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                background:
                  currentProjectId === project.id ? 'var(--color-sidebar-active)' : 'transparent',
                transition: 'background var(--transition)',
              }}
              onMouseEnter={(e) => {
                if (currentProjectId !== project.id)
                  e.currentTarget.style.background = 'var(--color-sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                if (currentProjectId !== project.id)
                  e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: project.color || 'var(--color-accent)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-sidebar-text)',
                }}
              >
                {project.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('このプロジェクトを削除しますか？'))
                    deleteProject(project.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-sidebar-text-muted)',
                  padding: 2,
                  display: 'flex',
                  opacity: 0,
                  transition: 'opacity var(--transition)',
                }}
                className="delete-btn"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '8px 12px', flex: 1 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--color-sidebar-text-muted)',
            letterSpacing: '0.5px',
            padding: '0 8px',
            display: 'block',
            marginBottom: 8,
          }}
        >
          ビュー
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => setView(view)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background:
                  currentView === view ? 'var(--color-sidebar-active)' : 'transparent',
                color: currentView === view ? 'var(--color-sidebar-text)' : 'var(--color-sidebar-text-muted)',
                fontSize: 13,
                fontWeight: currentView === view ? 500 : 400,
                transition: 'all var(--transition)',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Button */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--color-sidebar-border)' }}>
        <button
          onClick={() => useUIStore.getState().setAIPanelOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid rgba(232, 99, 74, 0.3)',
            background: 'rgba(232, 99, 74, 0.1)',
            color: '#E8634A',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
        >
          <Sparkles size={16} />
          AIアシスタント
        </button>
      </div>
    </aside>
  );
};
