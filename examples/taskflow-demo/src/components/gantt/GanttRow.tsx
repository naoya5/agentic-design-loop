import React, { useCallback, useRef, useState } from 'react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import type { Task } from '../../types';
import { PRIORITY_COLORS } from '../../types';

interface GanttRowProps {
  task: Task;
  dayWidth: number;
  startDate: Date;
  rowHeight: number;
  rowIndex: number;
  isSelected: boolean;
  isCritical?: boolean;
  onDragStart: (taskId: string, type: 'move' | 'resize-left' | 'resize-right') => void;
  onDragEnd: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onSelect: (taskId: string) => void;
}

const BAR_HEIGHT = 24;
const HANDLE_WIDTH = 6;

const GanttRow: React.FC<GanttRowProps> = ({
  task,
  dayWidth,
  startDate,
  rowHeight,
  rowIndex,
  isSelected,
  isCritical = false,
  onDragStart,
  onDragEnd,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const taskStart = task.start_date ? parseISO(task.start_date) : null;
  const taskEnd = task.due_date ? parseISO(task.due_date) : null;

  const hasValidDates =
    taskStart && taskEnd && isValid(taskStart) && isValid(taskEnd);

  if (!hasValidDates) {
    // Render a placeholder dash for tasks without dates
    const today = new Date();
    const todayOffset = differenceInDays(today, startDate);
    const cx = todayOffset * dayWidth + dayWidth / 2;
    const cy = rowHeight / 2;

    return (
      <g>
        {/* Placeholder line */}
        <line
          x1={cx - 12}
          y1={cy}
          x2={cx + 12}
          y2={cy}
          stroke="var(--color-text-secondary, #6B6B6B)"
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.4}
        />
        <circle
          cx={cx}
          cy={cy}
          r={3}
          fill="var(--color-text-secondary, #6B6B6B)"
          opacity={0.4}
        />
      </g>
    );
  }

  const startOffset = differenceInDays(taskStart!, startDate);
  const duration = differenceInDays(taskEnd!, taskStart!) + 1;
  const x = startOffset * dayWidth;
  const width = Math.max(duration * dayWidth, dayWidth);
  const y = (rowHeight - BAR_HEIGHT) / 2;
  const barColor = PRIORITY_COLORS[task.priority] || '#5BAA8A';

  // Text fitting
  const textPadding = 12;
  const maxTextWidth = width - textPadding * 2;
  const showText = maxTextWidth > 20;

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      setHovered(true);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTooltipPos(null);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
      e.stopPropagation();
      e.preventDefault();
      onDragStart(task.id, type);
    },
    [task.id, onDragStart]
  );

  return (
    <g>
      {/* Critical path highlight */}
      {isCritical && (
        <rect
          x={x - 3}
          y={y - 3}
          width={width + 6}
          height={BAR_HEIGHT + 6}
          rx={5}
          ry={5}
          fill="none"
          stroke="var(--color-danger, #C94040)"
          strokeWidth={2.5}
          strokeDasharray="6 3"
          opacity={0.8}
        />
      )}

      {/* Selected highlight */}
      {isSelected && (
        <rect
          x={x - 2}
          y={y - 2}
          width={width + 4}
          height={BAR_HEIGHT + 4}
          rx={4}
          ry={4}
          fill="none"
          stroke="var(--color-accent, #E8634A)"
          strokeWidth={2}
          opacity={0.7}
        />
      )}

      {/* Task bar background (shadow) */}
      <rect
        x={x + 1}
        y={y + 2}
        width={width}
        height={BAR_HEIGHT}
        rx={3}
        ry={3}
        fill="rgba(0,0,0,0.08)"
      />

      {/* Main task bar */}
      <rect
        x={x}
        y={y}
        width={width}
        height={BAR_HEIGHT}
        rx={3}
        ry={3}
        fill={barColor}
        opacity={hovered ? 0.9 : 0.85}
        cursor="grab"
        onClick={() => onSelect(task.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      />

      {/* Progress overlay (done = full, in_progress = half, review = 75%) */}
      {task.status !== 'todo' && (
        <rect
          x={x}
          y={y}
          width={
            width *
            (task.status === 'done'
              ? 1
              : task.status === 'review'
              ? 0.75
              : 0.4)
          }
          height={BAR_HEIGHT}
          rx={3}
          ry={3}
          fill="rgba(255,255,255,0.2)"
          pointerEvents="none"
        />
      )}

      {/* Task title text inside bar */}
      {showText && (
        <text
          x={x + textPadding}
          y={y + BAR_HEIGHT / 2}
          dominantBaseline="central"
          fill="var(--color-on-primary)"
          fontSize={11}
          fontWeight={500}
          fontFamily="'Noto Sans JP', sans-serif"
          pointerEvents="none"
          clipPath={`inset(0 ${textPadding}px 0 0)`}
        >
          {task.title.length > Math.floor(maxTextWidth / 7)
            ? task.title.substring(0, Math.floor(maxTextWidth / 7)) + '...'
            : task.title}
        </text>
      )}

      {/* Left resize handle */}
      <rect
        x={x}
        y={y}
        width={HANDLE_WIDTH}
        height={BAR_HEIGHT}
        rx={3}
        ry={3}
        fill="transparent"
        cursor="ew-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Right resize handle */}
      <rect
        x={x + width - HANDLE_WIDTH}
        y={y}
        width={HANDLE_WIDTH}
        height={BAR_HEIGHT}
        rx={3}
        ry={3}
        fill="transparent"
        cursor="ew-resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Hover handles visual indicator */}
      {hovered && (
        <>
          <rect
            x={x + 1}
            y={y + 6}
            width={3}
            height={BAR_HEIGHT - 12}
            rx={1}
            fill="rgba(255,255,255,0.6)"
            pointerEvents="none"
          />
          <rect
            x={x + width - 4}
            y={y + 6}
            width={3}
            height={BAR_HEIGHT - 12}
            rx={1}
            fill="rgba(255,255,255,0.6)"
            pointerEvents="none"
          />
        </>
      )}

      {/* Tooltip */}
      {hovered && tooltipPos && (
        <g>
          <rect
            x={x + width / 2 - 80}
            y={y - 48}
            width={160}
            height={40}
            rx={4}
            fill="var(--color-primary, #1B2838)"
            opacity={0.95}
          />
          <text
            x={x + width / 2}
            y={y - 35}
            textAnchor="middle"
            fill="var(--color-on-primary)"
            fontSize={10}
            fontWeight={500}
            fontFamily="'Noto Sans JP', sans-serif"
          >
            {task.title.length > 22
              ? task.title.substring(0, 22) + '...'
              : task.title}
          </text>
          <text
            x={x + width / 2}
            y={y - 20}
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize={9}
            fontFamily="'Noto Sans JP', sans-serif"
          >
            {format(taskStart!, 'M/d')} - {format(taskEnd!, 'M/d')} ({duration}日)
          </text>
        </g>
      )}
    </g>
  );
};

export default GanttRow;
