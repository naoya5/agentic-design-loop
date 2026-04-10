export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  role: string;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_name?: string;
  assignee_color?: string;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  sort_order: number;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: string;
  from_task_id: string;
  to_task_id: string;
  type: DependencyType;
}

export interface Comment {
  id: string;
  task_id: string;
  member_id: string | null;
  member_name?: string;
  member_color?: string;
  content: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string | null;
  task_id: string | null;
  task_title?: string;
  member_id: string | null;
  member_name?: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface AIDecomposeResult {
  title: string;
  description: string;
  estimated_hours: number;
  priority: TaskPriority;
}

export interface AIRiskAnalysis {
  at_risk_tasks: { task_id: string; title: string; reason: string }[];
  bottlenecks: string[];
  overloaded_members: { name: string; task_count: number }[];
  recommendations: string[];
}

export interface AIDailySummary {
  summary: string;
  completed: string[];
  in_progress: string[];
  blockers: string[];
  priorities: string[];
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '緊急',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#5BAA8A',
  medium: '#E8A838',
  high: '#E8634A',
  critical: '#C94040',
};

export const STATUS_COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
