import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, TrendingUp, AlertTriangle,
  Users, Activity, Target, Calendar,
} from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useMemberStore } from '../../stores/memberStore';
import { api } from '../../api';
import type { Task, TaskStatus, TaskPriority, ActivityLog } from '../../types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

import { DashboardCard, emptyMessageStyle } from './DashboardCard';
import { ProgressOverview } from './ProgressOverview';
import { DeadlineAlerts } from './DeadlineAlerts';
import { MemberWorkload } from './MemberWorkload';
import { RecentActivity } from './RecentActivity';

/* ── helpers ── */

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'var(--color-text-secondary)',
  in_progress: 'var(--color-accent)',
  review: 'var(--color-warning)',
  done: 'var(--color-success)',
};

const STATUS_JP: Record<TaskStatus, string> = {
  todo: '未着手',
  in_progress: '進行中',
  review: 'レビュー',
  done: '完了',
};

function buildBurndownData(tasks: Task[]): { date: string; remaining: number }[] {
  if (tasks.length === 0) return [];
  const dates = tasks.map((t) => new Date(t.created_at).getTime());
  const minDate = new Date(Math.min(...dates));
  const today = new Date();
  minDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const points: { date: string; remaining: number }[] = [];
  const totalDays = Math.min(Math.floor((today.getTime() - minDate.getTime()) / 86400000), 30);
  const startDay = totalDays > 14 ? totalDays - 14 : 0;

  for (let i = startDay; i <= totalDays; i++) {
    const d = new Date(minDate.getTime() + i * 86400000);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    const remaining = tasks.filter((t) => {
      if (t.status !== 'done') return true;
      const updated = new Date(t.updated_at);
      updated.setHours(0, 0, 0, 0);
      return updated.getTime() > d.getTime();
    }).length;
    points.push({ date: dateStr, remaining });
  }
  return points;
}

/* ── styles ── */

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  gap: '20px',
  padding: '24px',
  fontFamily: 'var(--font-data)',
};

const pageHeaderStyle: React.CSSProperties = {
  padding: '24px 24px 0',
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--color-primary)',
  fontFamily: 'var(--font-data)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

/* ── component ── */

export const Dashboard: React.FC = () => {
  const { tasks, loading: tasksLoading } = useTaskStore();
  const { members } = useMemberStore();
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>([]);
  const [actLoading, setActLoading] = React.useState(false);

  React.useEffect(() => {
    if (!currentProjectId) return;
    (async () => {
      try {
        setActLoading(true);
        const logs = await api.getActivity(currentProjectId, 10);
        setActivityLogs(logs);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'アクティビティの取得に失敗しました';
        toast.error(message);
      } finally {
        setActLoading(false);
      }
    })();
  }, [currentProjectId]);

  if (tasksLoading) return <LoadingSpinner />;

  /* data */
  const total = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const reviewTasks = tasks.filter((t) => t.status === 'review');

  const statusData = [
    { name: STATUS_JP.todo, value: todoTasks.length, color: STATUS_COLORS.todo },
    { name: STATUS_JP.in_progress, value: inProgress.length, color: STATUS_COLORS.in_progress },
    { name: STATUS_JP.review, value: reviewTasks.length, color: STATUS_COLORS.review },
    { name: STATUS_JP.done, value: doneTasks.length, color: STATUS_COLORS.done },
  ].filter((d) => d.value > 0);

  const priorityData: { name: string; count: number; fill: string }[] = (
    ['low', 'medium', 'high', 'critical'] as TaskPriority[]
  ).map((p) => ({
    name: PRIORITY_LABELS[p],
    count: tasks.filter((t) => t.priority === p).length,
    fill: PRIORITY_COLORS[p],
  }));

  const burndownData = buildBurndownData(tasks);

  return (
    <div>
      <div style={pageHeaderStyle}>
        <BarChart3 size={22} />
        ダッシュボード
      </div>

      <div style={gridStyle}>
        {/* (a) Progress Overview */}
        <DashboardCard
          icon={<Target size={16} style={{ color: 'var(--color-accent)' }} />}
          title="進捗オーバービュー"
        >
          <ProgressOverview tasks={tasks} />
        </DashboardCard>

        {/* (b) Status Distribution */}
        <DashboardCard
          icon={<BarChart3 size={16} style={{ color: 'var(--color-accent)' }} />}
          title="ステータス分布"
        >
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} タスク`, name]}
                  contentStyle={{ borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-data)', background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
                />
                <Legend
                  iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: '12px', fontFamily: 'var(--font-data)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyMessageStyle}>タスクがありません</div>
          )}
        </DashboardCard>

        {/* (c) Burndown Chart */}
        <DashboardCard
          icon={<TrendingUp size={16} style={{ color: 'var(--color-accent)' }} />}
          title="バーンダウンチャート"
        >
          {burndownData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={burndownData}>
                <defs>
                  <linearGradient id="burndownGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'var(--font-data)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'var(--font-data)' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-data)', background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
                  formatter={(v: number) => [`${v} タスク`, '残タスク']}
                />
                <Area
                  type="monotone" dataKey="remaining"
                  stroke="var(--color-accent)" strokeWidth={2}
                  fill="url(#burndownGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyMessageStyle}>データ不足</div>
          )}
        </DashboardCard>

        {/* (d) Priority Distribution */}
        <DashboardCard
          icon={<AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />}
          title="優先度分布"
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priorityData} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'var(--font-data)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'var(--font-data)' }} />
              <Tooltip
                contentStyle={{ borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-data)', background: 'var(--color-card-bg)', border: '1px solid var(--color-border)' }}
                formatter={(v: number) => [`${v} タスク`]}
              />
              {priorityData.map((_, i) => (
                <Bar key={i} dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, j) => (
                    <Cell key={j} fill={entry.fill} />
                  ))}
                </Bar>
              )).slice(0, 1)}
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* (e) Deadline Alerts */}
        <DashboardCard
          icon={<Calendar size={16} style={{ color: 'var(--color-danger)' }} />}
          title="期限アラート"
        >
          <DeadlineAlerts tasks={tasks} />
        </DashboardCard>

        {/* (f) Member Workload */}
        <DashboardCard
          icon={<Users size={16} style={{ color: 'var(--color-accent)' }} />}
          title="メンバー負荷"
        >
          <MemberWorkload members={members} tasks={tasks} />
        </DashboardCard>

        {/* (g) Recent Activity */}
        <DashboardCard
          icon={<Activity size={16} style={{ color: 'var(--color-accent)' }} />}
          title="最近のアクティビティ"
          gridSpan={1}
        >
          <RecentActivity activityLogs={activityLogs} loading={actLoading} />
        </DashboardCard>
      </div>
    </div>
  );
};

export default Dashboard;
