import { differenceInDays, parseISO, isValid } from 'date-fns';
import type { Task, TaskDependency } from '../types';

interface CriticalPathNode {
  taskId: string;
  duration: number;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
}

/**
 * Calculate the critical path using CPM (Critical Path Method).
 * Returns a Set of task IDs that are on the critical path.
 */
export function calculateCriticalPath(
  tasks: Task[],
  dependencies: TaskDependency[]
): Set<string> {
  const criticalTaskIds = new Set<string>();

  // Only consider tasks with valid dates
  const datedTasks = tasks.filter((t) => {
    const s = t.start_date ? parseISO(t.start_date) : null;
    const e = t.due_date ? parseISO(t.due_date) : null;
    return s && isValid(s) && e && isValid(e);
  });

  if (datedTasks.length === 0) return criticalTaskIds;

  // Build adjacency lists
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  datedTasks.forEach((t) => {
    successors.set(t.id, []);
    predecessors.set(t.id, []);
  });

  const taskIds = new Set(datedTasks.map((t) => t.id));

  // Only FS (Finish-to-Start) dependencies for critical path
  dependencies
    .filter((d) => d.type === 'FS' && taskIds.has(d.from_task_id) && taskIds.has(d.to_task_id))
    .forEach((d) => {
      successors.get(d.from_task_id)?.push(d.to_task_id);
      predecessors.get(d.to_task_id)?.push(d.from_task_id);
    });

  // Calculate durations
  const nodes = new Map<string, CriticalPathNode>();
  datedTasks.forEach((t) => {
    const s = parseISO(t.start_date!);
    const e = parseISO(t.due_date!);
    const duration = Math.max(differenceInDays(e, s), 1);
    nodes.set(t.id, {
      taskId: t.id,
      duration,
      earliestStart: 0,
      earliestFinish: 0,
      latestStart: Infinity,
      latestFinish: Infinity,
      slack: 0,
    });
  });

  // Topological sort
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function topSort(id: string): boolean {
    if (visited.has(id)) return true;
    if (visiting.has(id)) return false; // cycle
    visiting.add(id);
    for (const succ of successors.get(id) || []) {
      if (!topSort(succ)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    sorted.unshift(id);
    return true;
  }

  for (const t of datedTasks) {
    if (!visited.has(t.id)) {
      if (!topSort(t.id)) {
        // Cycle detected, return all tasks as "no critical path"
        return criticalTaskIds;
      }
    }
  }

  // Forward pass: calculate earliest start/finish
  for (const id of sorted) {
    const node = nodes.get(id)!;
    const preds = predecessors.get(id) || [];
    if (preds.length > 0) {
      node.earliestStart = Math.max(
        ...preds.map((p) => nodes.get(p)!.earliestFinish)
      );
    }
    node.earliestFinish = node.earliestStart + node.duration;
  }

  // Project end time
  const projectEnd = Math.max(...Array.from(nodes.values()).map((n) => n.earliestFinish));

  // Backward pass: calculate latest start/finish
  for (const id of [...sorted].reverse()) {
    const node = nodes.get(id)!;
    const succs = successors.get(id) || [];
    if (succs.length === 0) {
      node.latestFinish = projectEnd;
    } else {
      node.latestFinish = Math.min(
        ...succs.map((s) => nodes.get(s)!.latestStart)
      );
    }
    node.latestStart = node.latestFinish - node.duration;
    node.slack = node.latestStart - node.earliestStart;
  }

  // Critical path = tasks with zero slack
  for (const [id, node] of nodes) {
    if (Math.abs(node.slack) < 0.5) {
      criticalTaskIds.add(id);
    }
  }

  // If no dependencies exist, highlight the longest task chain
  if (dependencies.filter((d) => taskIds.has(d.from_task_id) && taskIds.has(d.to_task_id)).length === 0) {
    // Find the task with longest duration as critical
    let maxDuration = 0;
    let longestId = '';
    for (const [id, node] of nodes) {
      if (node.duration > maxDuration) {
        maxDuration = node.duration;
        longestId = id;
      }
    }
    if (longestId) criticalTaskIds.add(longestId);
  }

  return criticalTaskIds;
}
