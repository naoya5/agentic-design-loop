import type {
  Project,
  Task,
  TaskDependency,
  Member,
  Comment,
  ActivityLog,
  TaskStatus,
  AIDecomposeResult,
  AIRiskAnalysis,
  AIDailySummary,
} from './types';

const STORAGE_KEY = 'taskflow-demo-db';

interface DB {
  projects: Project[];
  tasks: Task[];
  dependencies: TaskDependency[];
  members: Member[];
  comments: Comment[];
  activity: ActivityLog[];
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

function loadDB(): DB {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return createSeedData();
}

function saveDB(db: DB): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let db = loadDB();

function persist() {
  saveDB(db);
}

// Simulate async API delay
function delay<T>(data: T, ms = 50): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(structuredClone(data)), ms));
}

function createSeedData(): DB {
  const projectId = 'proj-seed-1';

  const members: Member[] = [
    { id: 'mem-1', name: '田中 太郎', email: 'tanaka@example.com', avatar_color: '#3B82F6', role: 'Tech Lead', created_at: now() },
    { id: 'mem-2', name: '佐藤 花子', email: 'sato@example.com', avatar_color: '#EC4899', role: 'Designer', created_at: now() },
    { id: 'mem-3', name: '鈴木 一郎', email: 'suzuki@example.com', avatar_color: '#10B981', role: 'Engineer', created_at: now() },
    { id: 'mem-4', name: '山田 美咲', email: 'yamada@example.com', avatar_color: '#F59E0B', role: 'PM', created_at: now() },
  ];

  const projects: Project[] = [
    { id: projectId, name: 'TaskFlow v2.0', description: '次世代プロジェクト管理ツールのリニューアル', color: '#6366F1', created_at: now(), updated_at: now() },
    { id: 'proj-seed-2', name: 'モバイルアプリ', description: 'iOS/Android対応のモバイルアプリ開発', color: '#EC4899', created_at: now(), updated_at: now() },
  ];

  const tasks: Task[] = [
    { id: 'task-1', project_id: projectId, title: 'カンバンボードのドラッグ&ドロップ実装', description: 'dnd-kitを使ってカンバンボードのタスク移動を実装する', status: 'done', priority: 'high', assignee_id: 'mem-3', assignee_name: '鈴木 一郎', assignee_color: '#10B981', start_date: '2026-03-01', due_date: '2026-03-15', estimated_hours: 24, sort_order: 1, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-2', project_id: projectId, title: 'ガントチャートのSVG描画', description: 'SVGベースでタスクバーのドラッグリサイズ対応', status: 'in_progress', priority: 'high', assignee_id: 'mem-3', assignee_name: '鈴木 一郎', assignee_color: '#10B981', start_date: '2026-03-10', due_date: '2026-04-05', estimated_hours: 40, sort_order: 2, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-3', project_id: projectId, title: 'UI/UXデザインリニューアル', description: 'ダークモード対応のデザインシステム構築', status: 'done', priority: 'medium', assignee_id: 'mem-2', assignee_name: '佐藤 花子', assignee_color: '#EC4899', start_date: '2026-02-15', due_date: '2026-03-10', estimated_hours: 32, sort_order: 3, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-4', project_id: projectId, title: 'タスク依存関係の可視化', description: 'ガントチャート上で依存関係の矢印を表示', status: 'in_progress', priority: 'medium', assignee_id: 'mem-1', assignee_name: '田中 太郎', assignee_color: '#3B82F6', start_date: '2026-03-20', due_date: '2026-04-10', estimated_hours: 16, sort_order: 4, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-5', project_id: projectId, title: 'ダッシュボード（バーンダウンチャート）', description: '進捗率とバーンダウンチャートをRechartsで実装', status: 'todo', priority: 'medium', assignee_id: 'mem-3', assignee_name: '鈴木 一郎', assignee_color: '#10B981', start_date: '2026-04-01', due_date: '2026-04-15', estimated_hours: 20, sort_order: 5, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-6', project_id: projectId, title: '期限アラート通知システム', description: '期限が近いタスクを色と通知で警告する', status: 'todo', priority: 'low', assignee_id: 'mem-1', assignee_name: '田中 太郎', assignee_color: '#3B82F6', start_date: '2026-04-05', due_date: '2026-04-20', estimated_hours: 12, sort_order: 6, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-7', project_id: projectId, title: 'アクティビティログの実装', description: 'タスクの変更履歴を記録・表示する', status: 'review', priority: 'medium', assignee_id: 'mem-3', assignee_name: '鈴木 一郎', assignee_color: '#10B981', start_date: '2026-03-15', due_date: '2026-03-30', estimated_hours: 16, sort_order: 7, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-8', project_id: projectId, title: 'チームメンバー管理画面', description: 'メンバーの追加・編集・削除とロール管理', status: 'done', priority: 'low', assignee_id: 'mem-4', assignee_name: '山田 美咲', assignee_color: '#F59E0B', start_date: '2026-02-20', due_date: '2026-03-05', estimated_hours: 10, sort_order: 8, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-9', project_id: projectId, title: 'AI タスク自動分解', description: 'Claude APIでタスクをサブタスクに自動分解', status: 'todo', priority: 'high', assignee_id: 'mem-1', assignee_name: '田中 太郎', assignee_color: '#3B82F6', start_date: '2026-04-10', due_date: '2026-04-25', estimated_hours: 24, sort_order: 9, parent_task_id: null, created_at: now(), updated_at: now() },
    { id: 'task-10', project_id: projectId, title: 'レスポンシブデザイン対応', description: 'タブレット・モバイルでの表示最適化', status: 'todo', priority: 'low', assignee_id: 'mem-2', assignee_name: '佐藤 花子', assignee_color: '#EC4899', start_date: '2026-04-15', due_date: '2026-04-30', estimated_hours: 20, sort_order: 10, parent_task_id: null, created_at: now(), updated_at: now() },
  ];

  // TaskDependency型に created_at がないため省略
  const dependencies: TaskDependency[] = [
    { id: 'dep-1', from_task_id: 'task-3', to_task_id: 'task-1', type: 'FS' },
    { id: 'dep-2', from_task_id: 'task-1', to_task_id: 'task-2', type: 'FS' },
    { id: 'dep-3', from_task_id: 'task-2', to_task_id: 'task-4', type: 'SS' },
    { id: 'dep-4', from_task_id: 'task-4', to_task_id: 'task-5', type: 'FS' },
  ];

  // ActivityLog型は detail（単数形）
  const activity: ActivityLog[] = [
    { id: 'act-1', project_id: projectId, task_id: 'task-1', member_id: 'mem-3', member_name: '鈴木 一郎', action: 'status_change', detail: 'ステータスを「完了」に変更', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'act-2', project_id: projectId, task_id: 'task-3', member_id: 'mem-2', member_name: '佐藤 花子', action: 'status_change', detail: 'ステータスを「完了」に変更', created_at: new Date(Date.now() - 172800000).toISOString() },
    { id: 'act-3', project_id: projectId, task_id: 'task-2', member_id: 'mem-3', member_name: '鈴木 一郎', action: 'update', detail: 'タスクの説明を更新', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'act-4', project_id: projectId, task_id: 'task-7', member_id: 'mem-3', member_name: '鈴木 一郎', action: 'status_change', detail: 'ステータスを「レビュー」に変更', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'act-5', project_id: projectId, task_id: 'task-8', member_id: 'mem-4', member_name: '山田 美咲', action: 'status_change', detail: 'ステータスを「完了」に変更', created_at: new Date(Date.now() - 259200000).toISOString() },
  ];

  const comments: Comment[] = [
    { id: 'com-1', task_id: 'task-2', member_id: 'mem-1', member_name: '田中 太郎', content: 'SVGのパフォーマンスが気になる。大量タスク時のテストをお願いします。', created_at: new Date(Date.now() - 43200000).toISOString() },
    { id: 'com-2', task_id: 'task-2', member_id: 'mem-3', member_name: '鈴木 一郎', content: '了解です！仮想化も検討します。', created_at: new Date(Date.now() - 36000000).toISOString() },
  ];

  const seedDB: DB = { projects, tasks, dependencies, members, comments, activity };
  saveDB(seedDB);
  return seedDB;
}

function addActivity(projectId: string, taskId: string | null, action: string, detail: string) {
  const log: ActivityLog = {
    id: generateId(),
    project_id: projectId,
    task_id: taskId,
    member_id: null,
    member_name: 'System',
    action,
    detail,
    created_at: now(),
  };
  db.activity.unshift(log);
  persist();
}

// ---- Public API (matches the shape of the original api.ts exports) ----

export const api = {
  // Projects
  getProjects: () => delay(db.projects),
  createProject: (data: { name: string; description?: string; color?: string }) => {
    const p: Project = {
      id: generateId(),
      name: data.name,
      description: data.description || '',
      color: data.color || '#6366F1',
      created_at: now(),
      updated_at: now(),
    };
    db.projects.push(p);
    persist();
    return delay(p);
  },
  updateProject: (id: string, data: Partial<Project>) => {
    const p = db.projects.find(p => p.id === id);
    if (!p) throw new Error('Project not found');
    Object.assign(p, data, { updated_at: now() });
    persist();
    return delay(p);
  },
  deleteProject: (id: string) => {
    db.projects = db.projects.filter(p => p.id !== id);
    db.tasks = db.tasks.filter(t => t.project_id !== id);
    persist();
    return delay({ success: true });
  },

  // Tasks
  getTasks: (projectId: string) =>
    delay(db.tasks.filter(t => t.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order)),
  createTask: (data: {
    project_id: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: string;
    assignee_id?: string | null;
    start_date?: string | null;
    due_date?: string | null;
    estimated_hours?: number | null;
    sort_order?: number;
    parent_task_id?: string | null;
  }) => {
    const member = data.assignee_id ? db.members.find(m => m.id === data.assignee_id) : null;
    const t: Task = {
      id: generateId(),
      project_id: data.project_id,
      title: data.title,
      description: data.description || '',
      status: data.status || 'todo',
      priority: (data.priority as Task['priority']) || 'medium',
      assignee_id: data.assignee_id || null,
      assignee_name: member?.name,
      assignee_color: member?.avatar_color,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      estimated_hours: data.estimated_hours || null,
      sort_order: data.sort_order ?? db.tasks.filter(t => t.project_id === data.project_id).length,
      parent_task_id: data.parent_task_id || null,
      created_at: now(),
      updated_at: now(),
    };
    db.tasks.push(t);
    addActivity(t.project_id, t.id, 'create', `タスク「${t.title}」を作成`);
    persist();
    return delay(t);
  },
  updateTask: (id: string, data: Partial<Task> & { assignee_id?: string | null }) => {
    const t = db.tasks.find(t => t.id === id);
    if (!t) throw new Error('Task not found');
    if (data.assignee_id !== undefined) {
      const m = db.members.find(m => m.id === data.assignee_id);
      data.assignee_name = m?.name;
      data.assignee_color = m?.avatar_color;
    }
    Object.assign(t, data, { updated_at: now() });
    addActivity(t.project_id, t.id, 'update', `タスク「${t.title}」を更新`);
    persist();
    return delay(t);
  },
  deleteTask: (id: string) => {
    const t = db.tasks.find(t => t.id === id);
    db.tasks = db.tasks.filter(t => t.id !== id);
    db.dependencies = db.dependencies.filter(d => d.from_task_id !== id && d.to_task_id !== id);
    if (t) addActivity(t.project_id, id, 'delete', `タスク「${t.title}」を削除`);
    persist();
    return delay({ success: true });
  },
  moveTask: (id: string, data: { status?: TaskStatus; sort_order?: number }) => {
    const t = db.tasks.find(t => t.id === id);
    if (!t) throw new Error('Task not found');
    if (data.status) {
      addActivity(t.project_id, t.id, 'status_change', `ステータスを「${data.status}」に変更`);
      t.status = data.status;
    }
    if (data.sort_order !== undefined) t.sort_order = data.sort_order;
    t.updated_at = now();
    persist();
    return delay(t);
  },
  getTaskDependencies: (id: string) =>
    delay(db.dependencies.filter(d => d.from_task_id === id || d.to_task_id === id)),
  addTaskDependency: (id: string, data: { to_task_id: string; type?: string }) => {
    const dep: TaskDependency = {
      id: generateId(),
      from_task_id: id,
      to_task_id: data.to_task_id,
      type: (data.type || 'FS') as TaskDependency['type'],
    };
    db.dependencies.push(dep);
    persist();
    return delay(dep);
  },
  removeTaskDependency: (_id: string, depId: string) => {
    db.dependencies = db.dependencies.filter(d => d.id !== depId);
    persist();
    return delay({ success: true });
  },

  // Members
  getMembers: () => delay(db.members),
  createMember: (data: { name: string; email?: string; avatar_color?: string; role?: string }) => {
    const m: Member = {
      id: generateId(),
      name: data.name,
      email: data.email || '',
      avatar_color: data.avatar_color || '#6366F1',
      role: data.role || 'Member',
      created_at: now(),
    };
    db.members.push(m);
    persist();
    return delay(m);
  },
  updateMember: (id: string, data: Partial<Member>) => {
    const m = db.members.find(m => m.id === id);
    if (!m) throw new Error('Member not found');
    Object.assign(m, data);
    persist();
    return delay(m);
  },
  deleteMember: (id: string) => {
    db.members = db.members.filter(m => m.id !== id);
    persist();
    return delay({ success: true });
  },

  // Comments
  getComments: (taskId: string) =>
    delay(
      db.comments
        .filter(c => c.task_id === taskId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    ),
  createComment: (data: { task_id: string; member_id?: string; content: string }) => {
    const member = data.member_id ? db.members.find(m => m.id === data.member_id) : null;
    const c: Comment = {
      id: generateId(),
      task_id: data.task_id,
      member_id: data.member_id || null,
      member_name: member?.name || 'Anonymous',
      content: data.content,
      created_at: now(),
    };
    db.comments.push(c);
    persist();
    return delay(c);
  },
  deleteComment: (id: string) => {
    db.comments = db.comments.filter(c => c.id !== id);
    persist();
    return delay({ success: true });
  },

  // Activity
  getActivity: (projectId: string, limit = 50) => {
    const logs = projectId
      ? db.activity.filter(a => a.project_id === projectId)
      : db.activity;
    return delay(logs.slice(0, limit));
  },

  // AI (mock responses — hardcoded but realistic Japanese content)
  aiDecompose: (data: { task_title: string; task_description?: string; project_context?: string }) => {
    return delay<{ subtasks: AIDecomposeResult[] }>(
      {
        subtasks: [
          { title: `${data.task_title} - 要件定義`, description: '要件を整理してドキュメント化する', estimated_hours: 4, priority: 'medium' },
          { title: `${data.task_title} - 設計`, description: '技術設計とコンポーネント設計を行う', estimated_hours: 8, priority: 'medium' },
          { title: `${data.task_title} - 実装`, description: 'コーディングとユニットテスト', estimated_hours: 16, priority: 'high' },
          { title: `${data.task_title} - レビュー・テスト`, description: 'コードレビューと結合テスト', estimated_hours: 4, priority: 'medium' },
        ],
      },
      300
    );
  },
  aiRiskAnalysis: (_data: { tasks: Task[] }) => {
    return delay<{ analysis: AIRiskAnalysis }>(
      {
        analysis: {
          at_risk_tasks: [
            { task_id: 'task-2', title: 'ガントチャートのSVG描画', reason: '期日まで余裕が少なく、依存タスクが多い' },
            { task_id: 'task-4', title: 'タスク依存関係の可視化', reason: 'task-2の完了待ちで遅延リスクあり' },
          ],
          bottlenecks: [
            'task-2（ガントチャート）がクリティカルパス上のボトルネック',
            '鈴木 一郎に高優先度タスクが集中',
          ],
          overloaded_members: [
            { name: '鈴木 一郎', task_count: 4 },
            { name: '田中 太郎', task_count: 3 },
          ],
          recommendations: [
            'バッファを設けて依存関係のボトルネックを監視',
            'タスクの開始日をずらすか、追加リソースの確保を検討',
            'スパイク（技術調査）タスクを追加して不確実性を低減',
          ],
        },
      },
      500
    );
  },
  aiDailySummary: (_data: { tasks: Task[]; activity_logs?: ActivityLog[]; project_name?: string }) => {
    return delay<AIDailySummary>(
      {
        summary: '本日は3件のタスクが更新されました。ガントチャートのSVG描画が進行中で、予定通り進捗しています。',
        completed: ['カンバンボードのドラッグ&ドロップ実装', 'チームメンバー管理画面'],
        in_progress: ['ガントチャートのSVG描画', 'タスク依存関係の可視化', 'アクティビティログの実装（レビュー中）'],
        blockers: ['タスク依存関係の可視化がガントチャート完了待ち'],
        priorities: ['バーンダウンチャートの実装を早めに着手することで進捗の可視化が早期に実現可能'],
      },
      500
    );
  },
};
