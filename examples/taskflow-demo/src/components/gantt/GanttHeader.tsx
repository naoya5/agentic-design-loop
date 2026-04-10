import React, { useMemo } from 'react';
import {
  format,
  eachDayOfInterval,
  isWeekend,
  differenceInDays,
  startOfMonth,
  addDays,
} from 'date-fns';

interface GanttHeaderProps {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
}

interface MonthGroup {
  label: string;
  startX: number;
  width: number;
}

const GanttHeader: React.FC<GanttHeaderProps> = ({ startDate, endDate, dayWidth }) => {
  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  const monthGroups = useMemo(() => {
    const groups: MonthGroup[] = [];
    let currentMonth = '';
    let groupStart = 0;
    let groupDays = 0;

    days.forEach((day, i) => {
      const monthKey = format(day, 'yyyy-MM');
      if (monthKey !== currentMonth) {
        if (currentMonth !== '') {
          groups.push({
            label: format(addDays(day, -1), 'yyyy年M月'),
            startX: groupStart * dayWidth,
            width: groupDays * dayWidth,
          });
        }
        currentMonth = monthKey;
        groupStart = i;
        groupDays = 1;
      } else {
        groupDays++;
      }
    });

    if (groupDays > 0 && days.length > 0) {
      groups.push({
        label: format(days[days.length - 1], 'yyyy年M月'),
        startX: groupStart * dayWidth,
        width: groupDays * dayWidth,
      });
    }

    return groups;
  }, [days, dayWidth]);

  const today = new Date();
  const todayIndex = differenceInDays(today, startDate);
  const isToday = (day: Date) => format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

  const totalWidth = days.length * dayWidth;
  const monthRowHeight = 28;
  const dayRowHeight = 32;
  const totalHeight = monthRowHeight + dayRowHeight;

  return (
    <svg width={totalWidth} height={totalHeight} style={{ display: 'block' }}>
      {/* Month row background */}
      <rect
        x={0}
        y={0}
        width={totalWidth}
        height={monthRowHeight}
        fill="var(--color-primary, #1B2838)"
      />

      {/* Month labels */}
      {monthGroups.map((group, i) => (
        <g key={i}>
          <rect
            x={group.startX}
            y={0}
            width={group.width}
            height={monthRowHeight}
            fill="var(--color-primary, #1B2838)"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={1}
          />
          <text
            x={group.startX + group.width / 2}
            y={monthRowHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-on-primary)"
            fontSize={12}
            fontWeight={600}
            fontFamily="'Noto Sans JP', sans-serif"
          >
            {group.label}
          </text>
        </g>
      ))}

      {/* Day row background */}
      <rect
        x={0}
        y={monthRowHeight}
        width={totalWidth}
        height={dayRowHeight}
        fill="var(--color-surface, #E8E2D9)"
      />

      {/* Day cells */}
      {days.map((day, i) => {
        const x = i * dayWidth;
        const weekend = isWeekend(day);
        const todayHighlight = isToday(day);

        return (
          <g key={i}>
            {/* Weekend / today highlight */}
            {(weekend || todayHighlight) && (
              <rect
                x={x}
                y={monthRowHeight}
                width={dayWidth}
                height={dayRowHeight}
                fill={
                  todayHighlight
                    ? 'rgba(232, 99, 74, 0.15)'
                    : 'rgba(27, 40, 56, 0.06)'
                }
              />
            )}

            {/* Day separator */}
            <line
              x1={x}
              y1={monthRowHeight}
              x2={x}
              y2={totalHeight}
              stroke="rgba(27, 40, 56, 0.08)"
              strokeWidth={1}
            />

            {/* Day number */}
            <text
              x={x + dayWidth / 2}
              y={monthRowHeight + dayRowHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={
                todayHighlight
                  ? 'var(--color-accent, #E8634A)'
                  : weekend
                  ? 'var(--color-text-secondary, #6B6B6B)'
                  : 'var(--color-primary, #1B2838)'
              }
              fontSize={11}
              fontWeight={todayHighlight ? 700 : 400}
              fontFamily="'Noto Sans JP', sans-serif"
            >
              {format(day, 'd')}
            </text>
          </g>
        );
      })}

      {/* Bottom border */}
      <line
        x1={0}
        y1={totalHeight - 0.5}
        x2={totalWidth}
        y2={totalHeight - 0.5}
        stroke="rgba(27, 40, 56, 0.15)"
        strokeWidth={1}
      />
    </svg>
  );
};

export default GanttHeader;
