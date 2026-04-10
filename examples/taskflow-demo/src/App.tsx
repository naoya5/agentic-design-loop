import React, { useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { TaskDetailPanel } from './components/kanban/TaskDetailPanel';
import GanttChart from './components/gantt/GanttChart';
import { Dashboard } from './components/dashboard/Dashboard';
import { MembersPage } from './components/members/MembersPage';
import { ActivityPage } from './components/activity/ActivityPage';
import { AIPanel } from './components/ai/AIPanel';
import { EmptyState } from './components/ui/EmptyState';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { useProjectStore } from './stores/projectStore';
import { useTaskStore } from './stores/taskStore';
import { useMemberStore } from './stores/memberStore';
import { useUIStore } from './stores/uiStore';
import { FolderKanban } from 'lucide-react';

export const App: React.FC = () => {
  const { projects, currentProjectId, fetchProjects, setCurrentProject, loading: projectsLoading } =
    useProjectStore();
  const { tasks, fetchTasks, dependencies } = useTaskStore();
  const { fetchMembers } = useMemberStore();
  const { currentView, darkMode, taskDetailOpen, aiPanelOpen, setSearchOpen } = useUIStore();

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
    fetchMembers();
  }, []);

  // Auto-select first project
  useEffect(() => {
    if (!currentProjectId && projects.length > 0) {
      setCurrentProject(projects[0].id);
    }
  }, [projects, currentProjectId]);

  // Fetch tasks when project changes
  useEffect(() => {
    if (currentProjectId) {
      fetchTasks(currentProjectId);
    }
  }, [currentProjectId]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K: search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Escape: close panels
      if (e.key === 'Escape') {
        useUIStore.getState().setTaskDetailOpen(false);
        useUIStore.getState().setAIPanelOpen(false);
        useUIStore.getState().setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderView = () => {
    if (projectsLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <LoadingSpinner size={40} />
        </div>
      );
    }

    if (!currentProjectId) {
      return (
        <EmptyState
          icon={<FolderKanban size={48} />}
          title="プロジェクトがありません"
          description="サイドバーの + ボタンから新しいプロジェクトを作成してください。"
        />
      );
    }

    switch (currentView) {
      case 'kanban':
        return <KanbanBoard />;
      case 'gantt':
        return <GanttChart tasks={tasks} dependencies={dependencies} />;
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <MembersPage />;
      case 'activity':
        return <ActivityPage />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <>
      <Layout>{renderView()}</Layout>
      {taskDetailOpen && <TaskDetailPanel />}
      {aiPanelOpen && <AIPanel />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            borderRadius: 'var(--radius-card)',
            background: 'var(--color-primary)',
            color: '#E8E2D9',
          },
        }}
      />
    </>
  );
};
