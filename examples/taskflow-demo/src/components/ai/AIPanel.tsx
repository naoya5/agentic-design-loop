import React from 'react';
import {
  Brain, Sparkles, RefreshCw, AlertTriangle, CheckCircle2,
  Target, Loader2, X, ArrowRight, Clock,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { useMemberStore } from '../../stores/memberStore';
import { useProjectStore } from '../../stores/projectStore';
import { api } from '../../api';
import type {
  AIDecomposeResult, AIRiskAnalysis, AIDailySummary, TaskPriority,
} from '../../types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/* ── styles ── */

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(27, 40, 56, 0.2)',
  zIndex: 44,
  transition: 'opacity 200ms',
};

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  right: 0,
  top: 0,
  width: '420px',
  height: '100vh',
  background: 'var(--color-panel-bg)',
  boxShadow: '-4px 0 24px rgba(27,40,56,0.12)',
  zIndex: 45,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', sans-serif",
  transition: 'transform 200ms ease',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--color-border, #ddd)',
  flexShrink: 0,
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid var(--color-border, #ddd)',
  flexShrink: 0,
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
};

const sectionCardStyle: React.CSSProperties = {
  background: 'var(--color-bg, #F5F1EB)',
  borderRadius: '6px',
  padding: '14px 16px',
  marginBottom: '10px',
  fontSize: '13px',
  transition: 'all 200ms',
};

const errorStyle: React.CSSProperties = {
  background: 'rgba(201,64,64,0.08)',
  border: '1px solid var(--color-danger, #C94040)',
  borderRadius: '6px',
  padding: '12px 16px',
  fontSize: '13px',
  color: 'var(--color-danger, #C94040)',
  marginTop: '12px',
};

/* ── tabs ── */

type TabKey = 'decompose' | 'risk' | 'summary';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'decompose', label: 'タスク分解', icon: <Target size={14} /> },
  { key: 'risk', label: 'リスク分析', icon: <AlertTriangle size={14} /> },
  { key: 'summary', label: '日次サマリー', icon: <Sparkles size={14} /> },
];

/* ── component ── */

export const AIPanel: React.FC = () => {
  const { aiPanelOpen, setAIPanelOpen } = useUIStore();
  const { tasks, createTask } = useTaskStore();
  const { members } = useMemberStore();
  const currentProjectId = useProjectStore((s) => s.currentProjectId);

  const [activeTab, setActiveTab] = React.useState<TabKey>('decompose');

  /* decompose state */
  const [decompTitle, setDecompTitle] = React.useState('');
  const [decompDesc, setDecompDesc] = React.useState('');
  const [decompLoading, setDecompLoading] = React.useState(false);
  const [decompResults, setDecompResults] = React.useState<AIDecomposeResult[] | null>(null);
  const [decompSelected, setDecompSelected] = React.useState<Set<number>>(new Set());
  const [decompError, setDecompError] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  /* risk state */
  const [riskLoading, setRiskLoading] = React.useState(false);
  const [riskResult, setRiskResult] = React.useState<AIRiskAnalysis | null>(null);
  const [riskError, setRiskError] = React.useState('');

  /* summary state */
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryResult, setSummaryResult] = React.useState<AIDailySummary | null>(null);
  const [summaryError, setSummaryError] = React.useState('');

  if (!aiPanelOpen) return null;

  /* handlers */
  const handleDecompose = async () => {
    if (!decompTitle.trim()) return;
    setDecompLoading(true);
    setDecompError('');
    setDecompResults(null);
    setDecompSelected(new Set());
    try {
      const result = await api.aiDecompose({ task_title: decompTitle, task_description: decompDesc });
      const subtasks: AIDecomposeResult[] = result.subtasks || [];
      setDecompResults(subtasks);
    } catch (e: unknown) {
      setDecompError(e instanceof Error ? e.message : 'AI分解に失敗しました');
    } finally {
      setDecompLoading(false);
    }
  };

  const toggleDecompSelect = (i: number) => {
    setDecompSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const createSelectedTasks = async () => {
    if (!decompResults || decompSelected.size === 0 || !currentProjectId) return;
    setCreating(true);
    try {
      for (const i of decompSelected) {
        const sub = decompResults[i];
        await createTask({
          project_id: currentProjectId,
          title: sub.title,
          description: sub.description,
          estimated_hours: sub.estimated_hours,
          priority: sub.priority,
          status: 'todo',
        });
      }
      setDecompResults(null);
      setDecompSelected(new Set());
      setDecompTitle('');
      setDecompDesc('');
    } catch {
      /* ignore */
    } finally {
      setCreating(false);
    }
  };

  const handleRiskAnalysis = async () => {
    setRiskLoading(true);
    setRiskError('');
    setRiskResult(null);
    try {
      const result = await api.aiRiskAnalysis({ tasks });
      setRiskResult(result.analysis);
    } catch (e: unknown) {
      setRiskError(e instanceof Error ? e.message : 'リスク分析に失敗しました');
    } finally {
      setRiskLoading(false);
    }
  };

  const handleDailySummary = async () => {
    setSummaryLoading(true);
    setSummaryError('');
    setSummaryResult(null);
    try {
      const result = await api.aiDailySummary({ tasks });
      setSummaryResult(result);
    } catch (e: unknown) {
      setSummaryError(e instanceof Error ? e.message : 'サマリー生成に失敗しました');
    } finally {
      setSummaryLoading(false);
    }
  };

  /* tab content */
  const renderDecompose = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Input
        label="タスクタイトル"
        value={decompTitle}
        onChange={(e) => setDecompTitle(e.target.value)}
        placeholder="例: ユーザー認証機能の実装"
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          説明
        </label>
        <textarea
          value={decompDesc}
          onChange={(e) => setDecompDesc(e.target.value)}
          placeholder="タスクの詳細を記述..."
          rows={3}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: '6px',
            border: '1px solid var(--color-border, #ddd)',
            background: 'var(--color-bg, #F5F1EB)',
            fontSize: '14px', fontFamily: "'Inter', sans-serif",
            color: 'var(--color-text)', resize: 'vertical', outline: 'none',
            transition: 'border-color 200ms',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border, #ddd)'; }}
        />
      </div>
      <Button
        variant="primary" size="sm"
        icon={<Brain size={14} />}
        loading={decompLoading}
        onClick={handleDecompose}
        disabled={!decompTitle.trim()}
      >
        AIで分解する
      </Button>

      {decompError && <div style={errorStyle}>{decompError}</div>}

      {decompLoading && <LoadingSpinner size={20} />}

      {decompResults && decompResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
            生成されたサブタスク ({decompResults.length}件)
          </div>
          {decompResults.map((sub, i) => (
            <div
              key={i}
              onClick={() => toggleDecompSelect(i)}
              style={{
                ...sectionCardStyle,
                cursor: 'pointer',
                border: decompSelected.has(i)
                  ? '2px solid var(--color-accent, #E8634A)'
                  : '2px solid transparent',
                animation: `panel-item-in 200ms ease ${i * 50}ms both`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={decompSelected.has(i)}
                  onChange={() => toggleDecompSelect(i)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{sub.title}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px', paddingLeft: '24px' }}>
                {sub.description}
              </div>
              <div style={{ display: 'flex', gap: '8px', paddingLeft: '24px' }}>
                <Badge
                  label={PRIORITY_LABELS[sub.priority]}
                  color={PRIORITY_COLORS[sub.priority]}
                  size="sm"
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={11} /> {sub.estimated_hours}h
                </span>
              </div>
            </div>
          ))}
          <Button
            variant="primary" size="sm"
            icon={<CheckCircle2 size={14} />}
            loading={creating}
            onClick={createSelectedTasks}
            disabled={decompSelected.size === 0}
          >
            選択したタスクを作成 ({decompSelected.size})
          </Button>
        </div>
      )}

      {decompResults && decompResults.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', padding: '16px 0' }}>
          サブタスクが生成されませんでした
        </div>
      )}
    </div>
  );

  const renderRisk = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Button
        variant="primary" size="sm"
        icon={<RefreshCw size={14} />}
        loading={riskLoading}
        onClick={handleRiskAnalysis}
      >
        リスクを分析する
      </Button>

      {riskError && <div style={errorStyle}>{riskError}</div>}

      {riskLoading && <LoadingSpinner size={20} />}

      {riskResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* at-risk tasks */}
          {riskResult.at_risk_tasks.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-danger, #C94040)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <AlertTriangle size={14} /> リスクのあるタスク
              </div>
              {riskResult.at_risk_tasks.map((t, i) => (
                <div
                  key={i}
                  style={{
                    ...sectionCardStyle,
                    background: 'rgba(201,64,64,0.06)',
                    border: '1px solid rgba(201,64,64,0.2)',
                    animation: `panel-item-in 200ms ease ${i * 50}ms both`,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{t.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-danger)' }}>{t.reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* bottlenecks */}
          {riskResult.bottlenecks.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-warning, #E8A838)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <AlertTriangle size={14} /> ボトルネック
              </div>
              {riskResult.bottlenecks.map((b, i) => (
                <div
                  key={i}
                  style={{
                    ...sectionCardStyle,
                    background: 'rgba(232,168,56,0.06)',
                    border: '1px solid rgba(232,168,56,0.2)',
                    animation: `panel-item-in 200ms ease ${i * 50}ms both`,
                  }}
                >
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={12} /> {b}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* overloaded members */}
          {riskResult.overloaded_members.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Target size={14} /> 過負荷メンバー
              </div>
              {riskResult.overloaded_members.map((m, i) => (
                <div
                  key={i}
                  style={{
                    ...sectionCardStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: `panel-item-in 200ms ease ${i * 50}ms both`,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{m.name}</span>
                  <Badge label={`${m.task_count} タスク`} color="var(--color-accent)" size="sm" />
                </div>
              ))}
            </div>
          )}

          {/* recommendations */}
          {riskResult.recommendations.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-success, #5BAA8A)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Sparkles size={14} /> 推奨事項
              </div>
              {riskResult.recommendations.map((r, i) => (
                <div
                  key={i}
                  style={{
                    ...sectionCardStyle,
                    background: 'rgba(91,170,138,0.06)',
                    border: '1px solid rgba(91,170,138,0.2)',
                    animation: `panel-item-in 200ms ease ${i * 50}ms both`,
                  }}
                >
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    {r}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSummary = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Button
        variant="primary" size="sm"
        icon={<Sparkles size={14} />}
        loading={summaryLoading}
        onClick={handleDailySummary}
      >
        日次サマリーを生成
      </Button>

      {summaryError && <div style={errorStyle}>{summaryError}</div>}

      {summaryLoading && <LoadingSpinner size={20} />}

      {summaryResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'panel-item-in 200ms ease' }}>
          {/* summary text */}
          <div style={{
            ...sectionCardStyle,
            background: 'rgba(91,170,138,0.06)',
            border: '1px solid rgba(91,170,138,0.2)',
          }}>
            <div style={{ fontSize: '13px', lineHeight: 1.7 }}>
              {summaryResult.summary}
            </div>
          </div>

          {/* completed */}
          {summaryResult.completed.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-success, #5BAA8A)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <CheckCircle2 size={14} /> 完了タスク
              </div>
              {summaryResult.completed.map((c, i) => (
                <div key={i} style={{ ...sectionCardStyle, animation: `panel-item-in 200ms ease ${i * 40}ms both` }}>
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} /> {c}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* in progress */}
          {summaryResult.in_progress.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <RefreshCw size={14} /> 進行中
              </div>
              {summaryResult.in_progress.map((p, i) => (
                <div key={i} style={{ ...sectionCardStyle, animation: `panel-item-in 200ms ease ${i * 40}ms both` }}>
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRight size={12} style={{ color: 'var(--color-accent)' }} /> {p}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* blockers */}
          {summaryResult.blockers.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-danger, #C94040)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <AlertTriangle size={14} /> ブロッカー
              </div>
              {summaryResult.blockers.map((b, i) => (
                <div
                  key={i}
                  style={{
                    ...sectionCardStyle,
                    background: 'rgba(201,64,64,0.06)',
                    border: '1px solid rgba(201,64,64,0.2)',
                    animation: `panel-item-in 200ms ease ${i * 40}ms both`,
                  }}
                >
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={12} style={{ color: 'var(--color-danger)' }} /> {b}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* priorities */}
          {summaryResult.priorities.length > 0 && (
            <div>
              <div style={{
                fontSize: '13px', fontWeight: 600, color: 'var(--color-warning, #E8A838)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Target size={14} /> 明日の優先事項
              </div>
              {summaryResult.priorities.map((p, i) => (
                <div key={i} style={{ ...sectionCardStyle, animation: `panel-item-in 200ms ease ${i * 40}ms both` }}>
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={12} style={{ color: 'var(--color-warning)' }} /> {p}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div style={overlayStyle} onClick={() => setAIPanelOpen(false)} />
      <div style={panelStyle}>
        {/* header */}
        <div style={headerStyle}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '16px', fontWeight: 700, color: 'var(--color-primary, #1B2838)',
          }}>
            <Brain size={20} style={{ color: 'var(--color-accent)' }} />
            AI アシスタント
          </div>
          <button
            onClick={() => setAIPanelOpen(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-hover, #eee)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* tab bar */}
        <div style={tabBarStyle}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 8px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key
                  ? '2px solid var(--color-accent, #E8634A)'
                  : '2px solid transparent',
                color: activeTab === tab.key
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* body */}
        <div style={bodyStyle}>
          {activeTab === 'decompose' && renderDecompose()}
          {activeTab === 'risk' && renderRisk()}
          {activeTab === 'summary' && renderSummary()}
        </div>
      </div>

      <style>{`
        @keyframes panel-item-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default AIPanel;
