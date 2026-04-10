import React from 'react';
import { Menu, Search, Sun, Moon, Sparkles, Filter, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { SearchBar } from '../ui/SearchBar';

export const Header: React.FC = () => {
  const {
    toggleSidebar,
    toggleDarkMode,
    darkMode,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
    setAIPanelOpen,
    filterPriority,
    filterAssignee,
    clearFilters,
    currentView,
  } = useUIStore();
  const currentProject = useProjectStore((s) => {
    const p = s.projects.find((p) => p.id === s.currentProjectId);
    return p;
  });

  const hasFilters = filterPriority || filterAssignee;

  return (
    <header
      style={{
        height: 56,
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        onClick={toggleSidebar}
        style={{
          padding: 6,
          borderRadius: 4,
          display: 'flex',
          color: 'var(--color-text-secondary)',
        }}
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        {currentProject && (
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
            }}
          >
            {currentProject.name}
          </h2>
        )}

        <div style={{ flex: 1, maxWidth: 400 }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="タスクを検索... (⌘K)"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-accent)',
            color: 'var(--color-on-accent)',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <Filter size={12} />
          フィルタ解除
          <X size={12} />
        </button>
      )}

      <button
        onClick={() => setAIPanelOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 'var(--radius-button)',
          background: 'rgba(232, 99, 74, 0.08)',
          color: 'var(--color-accent)',
          fontSize: 13,
          fontWeight: 500,
        }}
        title="AIアシスタント"
      >
        <Sparkles size={16} />
        <span style={{ display: 'none' }}>AI</span>
      </button>

      <button
        onClick={toggleDarkMode}
        style={{
          padding: 6,
          borderRadius: 4,
          display: 'flex',
          color: 'var(--color-text-secondary)',
        }}
        title={darkMode ? 'ライトモード' : 'ダークモード'}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
};
