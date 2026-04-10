import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  format,
  differenceInDays,
  addDays,
  parseISO,
  isValid,
  isWeekend,
  eachDayOfInterval,
} from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import type { Task, TaskDependency } from '../../types';
import { PRIORITY_COLORS } from '../../types';
import { useTaskStore } from '../../stores/taskStore';
import { useMemberStore } from '../../stores/memberStore';
import { calculateCriticalPath } from '../../utils/criticalPath';
import GanttHeader from './GanttHeader';
import GanttRow from './GanttRow';

interface GanttChartProps {
  tasks: Task[];
  dependencies: TaskDependency[];
}

const DAY_WIDTH = 40;
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 60; // month row + day row
const LEFT_PANEL_WIDTH = 280;

const GanttChart: React.FC<GanttChartProps> = ({ tasks, dependencies }) => {
  const { updateTask, setSelectedTask, selectedTaskId } = useTaskStore();
  const { getMemberById } = useMemberStore();

  const rightPanelRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  const [showCriticalPath, setShowCriticalPath] = useState(true);

  // Critical path calculation
  const criticalTaskIds = useMemo(() => {
    if (!showCriticalPath) return new Set<string>();
    return calculateCriticalPath(tasks, dependencies);
  }, [tasks, dependencies, showCriticalPath]);

  // Drag state
  const [dragState, setDragState] = useState<{
    taskId: string;
    type: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);

  const [dragOffset, setDragOffset] = useState(0);

  // Calculate timeline range
  const { timelineStart, timelineEnd, tasksWithDates } = useMemo(() => {
    const dated: { task: Task; start: Date; end: Date }[] = [];
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    tasks.forEach((task) => {
      const s = task.start_date ? parseISO(task.start_date) : null;
      const e = task.due_date ? parseISO(task.due_date) : null;

      if (s && isValid(s) && e && isValid(e)) {
        dated.push({ task, start: s, end: e });
        if (!minDate || s < minDate) minDate = s;
        if (!maxDate || e > maxDate) maxDate = e;
      }
    });

    const today = new Date();
    if (!minDate) minDate = addDays(today, -7);
    if (!maxDate) maxDate = addDays(today, 14);

    // Add 7-day padding
    const timelineStart = addDays(minDate!, -7);
    const timelineEnd = addDays(maxDate!, 7);

    return { timelineStart, timelineEnd, tasksWithDates: dated };
  }, [tasks]);

  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
  const totalWidth = totalDays * DAY_WIDTH;
  const totalHeight = tasks.length * ROW_HEIGHT;

  const days = useMemo(
    () => eachDayOfInterval({ start: timelineStart, end: timelineEnd }),
    [timelineStart, timelineEnd]
  );

  // Today line position
  const today = new Date();
  const todayOffset = differenceInDays(today, timelineStart);
  const todayX = todayOffset * DAY_WIDTH + DAY_WIDTH / 2;

  // Scroll sync
  const handleRightScroll = useCallback(() => {
    if (rightPanelRef.current && leftPanelRef.current) {
      leftPanelRef.current.scrollTop = rightPanelRef.current.scrollTop;
    }
  }, []);

  const handleLeftScroll = useCallback(() => {
    if (leftPanelRef.current && rightPanelRef.current) {
      rightPanelRef.current.scrollTop = leftPanelRef.current.scrollTop;
    }
  }, []);

  // Drag handlers
  const handleDragStart = useCallback(
    (taskId: string, type: 'move' | 'resize-left' | 'resize-right') => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task || !task.start_date || !task.due_date) return;

      const s = parseISO(task.start_date);
      const e = parseISO(task.due_date);
      if (!isValid(s) || !isValid(e)) return;

      setDragState({
        taskId,
        type,
        startX: 0,
        originalStart: s,
        originalEnd: e,
      });
      setDragOffset(0);
    },
    [tasks]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;

      if (dragState.startX === 0) {
        setDragState((prev) => (prev ? { ...prev, startX: e.clientX } : null));
        return;
      }

      const dx = e.clientX - dragState.startX;
      setDragOffset(dx);
    },
    [dragState]
  );

  const handleMouseUp = useCallback(async () => {
    if (!dragState) return;

    const daysMoved = Math.round(dragOffset / DAY_WIDTH);

    if (daysMoved !== 0) {
      let newStart: Date;
      let newEnd: Date;

      switch (dragState.type) {
        case 'move':
          newStart = addDays(dragState.originalStart, daysMoved);
          newEnd = addDays(dragState.originalEnd, daysMoved);
          break;
        case 'resize-left':
          newStart = addDays(dragState.originalStart, daysMoved);
          newEnd = dragState.originalEnd;
          if (newStart > newEnd) newStart = newEnd;
          break;
        case 'resize-right':
          newStart = dragState.originalStart;
          newEnd = addDays(dragState.originalEnd, daysMoved);
          if (newEnd < newStart) newEnd = newStart;
          break;
      }

      try {
        await updateTask(dragState.taskId, {
          start_date: format(newStart, 'yyyy-MM-dd'),
          due_date: format(newEnd, 'yyyy-MM-dd'),
        });
      } catch (err) {
        console.error('Failed to update task dates:', err);
      }
    }

    setDragState(null);
    setDragOffset(0);
  }, [dragState, dragOffset, updateTask]);

  // Global mouse up listener for drag
  useEffect(() => {
    if (dragState) {
      const handler = () => handleMouseUp();
      window.addEventListener('mouseup', handler);
      return () => window.removeEventListener('mouseup', handler);
    }
  }, [dragState, handleMouseUp]);

  // Dependency arrow rendering
  const renderDependencyArrows = useMemo(() => {
    return dependencies.map((dep) => {
      const fromTask = tasks.find((t) => t.id === dep.from_task_id);
      const toTask = tasks.find((t) => t.id === dep.to_task_id);

      if (!fromTask || !toTask) return null;

      const fromStart = fromTask.start_date ? parseISO(fromTask.start_date) : null;
      const fromEnd = fromTask.due_date ? parseISO(fromTask.due_date) : null;
      const toStart = toTask.start_date ? parseISO(toTask.start_date) : null;

      if (!fromEnd || !isValid(fromEnd) || !toStart || !isValid(toStart)) return null;

      const fromIndex = tasks.indexOf(fromTask);
      const toIndex = tasks.indexOf(toTask);

      // FS: end of source to start of target
      const fromX =
        (differenceInDays(fromEnd, timelineStart) + 1) * DAY_WIDTH;
      const fromY = fromIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
      const toX = differenceInDays(toStart, timelineStart) * DAY_WIDTH;
      const toY = toIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

      // Bezier curve control points
      const midX = (fromX + toX) / 2;
      const cpOffset = Math.min(Math.abs(toX - fromX) * 0.4, 40);

      const path =
        toX > fromX
          ? `M ${fromX} ${fromY} C ${fromX + cpOffset} ${fromY}, ${toX - cpOffset} ${toY}, ${toX} ${toY}`
          : `M ${fromX} ${fromY} C ${fromX + 20} ${fromY}, ${fromX + 20} ${(fromY + toY) / 2}, ${midX} ${(fromY + toY) / 2} S ${toX - 20} ${toY}, ${toX} ${toY}`;

      // Arrowhead
      const arrowSize = 5;
      const arrowPath = `M ${toX} ${toY} L ${toX - arrowSize} ${toY - arrowSize} L ${toX - arrowSize} ${toY + arrowSize} Z`;

      return (
        <g key={dep.id}>
          <path
            d={path}
            fill="none"
            stroke="var(--color-text-secondary, #6B6B6B)"
            strokeWidth={1.5}
            opacity={0.5}
            markerEnd="none"
          />
          <path
            d={arrowPath}
            fill="var(--color-text-secondary, #6B6B6B)"
            opacity={0.5}
          />
        </g>
      );
    });
  }, [dependencies, tasks, timelineStart]);

  // Calculate drag-adjusted position for a task
  const getTaskDragTransform = useCallback(
    (taskId: string) => {
      if (!dragState || dragState.taskId !== taskId) return '';
      return `translate(${dragOffset}, 0)`;
    },
    [dragState, dragOffset]
  );

  if (tasks.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          color: 'var(--color-text-secondary, #6B6B6B)',
          fontFamily: "'Noto Sans JP', sans-serif",
          fontSize: 14,
          background: 'var(--color-bg, #F5F1EB)',
          borderRadius: 8,
        }}
      >
        タスクがまだありません
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        borderBottom: '1px solid var(--color-border)',
        fontSize: '12px',
      }}>
        <button
          onClick={() => setShowCriticalPath(!showCriticalPath)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-button)',
            border: '1px solid var(--color-border)',
            background: showCriticalPath ? 'var(--color-danger)' : 'transparent',
            color: showCriticalPath ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
        >
          <AlertTriangle size={13} />
          クリティカルパス
        </button>
        {showCriticalPath && criticalTaskIds.size > 0 && (
          <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-data)' }}>
            {criticalTaskIds.size}タスクがクリティカルパス上
          </span>
        )}
      </div>
    <div
      style={{
        display: 'flex',
        border: '1px solid rgba(27, 40, 56, 0.12)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--color-bg, #F5F1EB)',
        fontFamily: "'Noto Sans JP', sans-serif",
        flex: 1,
        minHeight: 400,
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Left panel: task list */}
      <div
        style={{
          width: LEFT_PANEL_WIDTH,
          minWidth: LEFT_PANEL_WIDTH,
          borderRight: '1px solid rgba(27, 40, 56, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface, #E8E2D9)',
        }}
      >
        {/* Left header */}
        <div
          style={{
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            borderBottom: '1px solid rgba(27, 40, 56, 0.12)',
            background: 'var(--color-primary, #1B2838)',
            color: 'var(--color-on-primary)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span style={{ flex: 1 }}>タスク名</span>
          <span style={{ width: 50, textAlign: 'center' }}>担当</span>
          <span style={{ width: 48, textAlign: 'center' }}>開始</span>
          <span style={{ width: 48, textAlign: 'center' }}>終了</span>
        </div>

        {/* Task rows */}
        <div
          ref={leftPanelRef}
          onScroll={handleLeftScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {tasks.map((task) => {
            const member = task.assignee_id
              ? getMemberById(task.assignee_id)
              : null;
            const isSelected = selectedTaskId === task.id;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                style={{
                  height: ROW_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  borderBottom: '1px solid rgba(27, 40, 56, 0.06)',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'rgba(232, 99, 74, 0.08)'
                    : 'transparent',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      'rgba(27, 40, 56, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      'transparent';
                  }
                }}
              >
                {/* Priority dot + critical indicator + title */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: criticalTaskIds.has(task.id) ? 'var(--color-danger)' : PRIORITY_COLORS[task.priority],
                      flexShrink: 0,
                      boxShadow: criticalTaskIds.has(task.id) ? '0 0 4px var(--color-danger)' : 'none',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--color-primary, #1B2838)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Assignee avatar */}
                <div style={{ width: 50, display: 'flex', justifyContent: 'center' }}>
                  {member ? (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: member.avatar_color || 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-on-accent)',
                        fontSize: 9,
                        fontWeight: 600,
                      }}
                      title={member.name}
                    >
                      {member.name.charAt(0)}
                    </div>
                  ) : (
                    <span
                      style={{
                        color: 'var(--color-text-secondary, #6B6B6B)',
                        fontSize: 10,
                      }}
                    >
                      --
                    </span>
                  )}
                </div>

                {/* Start date */}
                <span
                  style={{
                    width: 48,
                    textAlign: 'center',
                    fontSize: 10,
                    color: 'var(--color-text-secondary, #6B6B6B)',
                  }}
                >
                  {task.start_date
                    ? format(parseISO(task.start_date), 'M/d')
                    : '--'}
                </span>

                {/* End date */}
                <span
                  style={{
                    width: 48,
                    textAlign: 'center',
                    fontSize: 10,
                    color: 'var(--color-text-secondary, #6B6B6B)',
                  }}
                >
                  {task.due_date
                    ? format(parseISO(task.due_date), 'M/d')
                    : '--'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: timeline */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Timeline header (fixed) */}
        <div style={{ overflowX: 'hidden', flexShrink: 0 }}>
          <div
            style={{
              width: totalWidth,
              transform: rightPanelRef.current
                ? `translateX(-${rightPanelRef.current.scrollLeft}px)`
                : undefined,
            }}
          >
            <GanttHeader
              startDate={timelineStart}
              endDate={timelineEnd}
              dayWidth={DAY_WIDTH}
            />
          </div>
        </div>

        {/* Timeline body (scrollable) */}
        <div
          ref={rightPanelRef}
          onScroll={(e) => {
            handleRightScroll();
            // Sync header scroll
            const scrollLeft = (e.target as HTMLDivElement).scrollLeft;
            const headerWrapper = (e.target as HTMLDivElement)
              .previousElementSibling?.firstElementChild as HTMLDivElement;
            if (headerWrapper) {
              headerWrapper.style.transform = `translateX(-${scrollLeft}px)`;
            }
          }}
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <svg
            width={totalWidth}
            height={Math.max(totalHeight, 400)}
            style={{ display: 'block' }}
          >
            {/* Background grid */}
            {days.map((day, i) => {
              const x = i * DAY_WIDTH;
              const weekend = isWeekend(day);
              return (
                <g key={i}>
                  {weekend && (
                    <rect
                      x={x}
                      y={0}
                      width={DAY_WIDTH}
                      height={Math.max(totalHeight, 400)}
                      fill="rgba(27, 40, 56, 0.03)"
                    />
                  )}
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={Math.max(totalHeight, 400)}
                    stroke="rgba(27, 40, 56, 0.05)"
                    strokeWidth={1}
                  />
                </g>
              );
            })}

            {/* Row separators */}
            {tasks.map((_, i) => (
              <line
                key={i}
                x1={0}
                y1={(i + 1) * ROW_HEIGHT}
                x2={totalWidth}
                y2={(i + 1) * ROW_HEIGHT}
                stroke="rgba(27, 40, 56, 0.05)"
                strokeWidth={1}
              />
            ))}

            {/* Dependency arrows (behind bars) */}
            {renderDependencyArrows}

            {/* Task bars */}
            {tasks.map((task, index) => (
              <g
                key={task.id}
                transform={`translate(0, ${index * ROW_HEIGHT}) ${getTaskDragTransform(task.id)}`}
              >
                <GanttRow
                  task={task}
                  dayWidth={DAY_WIDTH}
                  startDate={timelineStart}
                  rowHeight={ROW_HEIGHT}
                  rowIndex={index}
                  isSelected={selectedTaskId === task.id}
                  isCritical={criticalTaskIds.has(task.id)}
                  onDragStart={handleDragStart}
                  onDragEnd={() => {}}
                  onSelect={(id) => setSelectedTask(id)}
                />
              </g>
            ))}

            {/* Today line */}
            {todayOffset >= 0 && todayOffset <= totalDays && (
              <g>
                <line
                  x1={todayX}
                  y1={0}
                  x2={todayX}
                  y2={Math.max(totalHeight, 400)}
                  stroke="var(--color-accent, #E8634A)"
                  strokeWidth={1.5}
                  strokeDasharray="6 3"
                  opacity={0.7}
                />
                {/* Today marker diamond */}
                <polygon
                  points={`${todayX},0 ${todayX + 5},6 ${todayX},12 ${todayX - 5},6`}
                  fill="var(--color-accent, #E8634A)"
                  opacity={0.8}
                />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
    </div>
  );
};

export default GanttChart;
