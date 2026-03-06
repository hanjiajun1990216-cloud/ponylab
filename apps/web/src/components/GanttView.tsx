"use client";

import { useCallback, useMemo } from "react";
import { Gantt, Task as GanttTask, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { api } from "@/lib/api";

interface PonyTask {
  id: string;
  title?: string;
  name?: string;
  createdAt: string;
  dueDate?: string | null;
  status: string;
  isMilestone?: boolean;
  dependsOn?: Array<{ upstreamTaskId: string }>;
}

interface GanttViewProps {
  tasks: PonyTask[];
  onTaskUpdate?: (taskId: string, data: { dueDate: string }) => void;
}

function toGanttTasks(tasks: PonyTask[]): GanttTask[] {
  return tasks
    .map((task: PonyTask): GanttTask | null => {
      const start = new Date(task.createdAt);
      const defaultEnd = new Date(start);
      defaultEnd.setDate(defaultEnd.getDate() + 7);

      const end = task.dueDate ? new Date(task.dueDate) : defaultEnd;

      // Ensure end is always after start to avoid invalid range errors
      const safeEnd = end > start ? end : defaultEnd;

      const progress =
        task.status === "DONE" || task.status === "COMPLETED"
          ? 100
          : task.status === "IN_PROGRESS"
            ? 50
            : 0;

      return {
        id: task.id,
        name: task.title || task.name || "Untitled Task",
        start,
        end: safeEnd,
        progress,
        type: task.isMilestone ? "milestone" : "task",
        dependencies:
          task.dependsOn?.map(
            (d: { upstreamTaskId: string }) => d.upstreamTaskId,
          ) || [],
      };
    })
    .filter((t: GanttTask | null): t is GanttTask => t !== null);
}

export function GanttView({ tasks, onTaskUpdate }: GanttViewProps) {
  const ganttTasks = useMemo(() => toGanttTasks(tasks), [tasks]);

  const handleDateChange = useCallback(
    (task: GanttTask): Promise<boolean> => {
      return api
        .updateTask(task.id, { dueDate: task.end.toISOString() })
        .then(() => {
          onTaskUpdate?.(task.id, { dueDate: task.end.toISOString() });
          return true;
        })
        .catch((err: unknown) => {
          console.error("Failed to update task due date:", err);
          return false;
        });
    },
    [onTaskUpdate],
  );

  if (ganttTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border border-gray-200 bg-white text-gray-400 text-sm">
        暂无任务，请先创建任务以查看甘特图
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-auto">
      <Gantt
        tasks={ganttTasks}
        viewMode={ViewMode.Week}
        locale="zh-CN"
        onDateChange={handleDateChange}
        ganttHeight={Math.min(ganttTasks.length * 50 + 60, 480)}
        columnWidth={65}
        listCellWidth="180px"
        barFill={80}
        todayColor="rgba(59, 130, 246, 0.1)"
        barProgressColor="#3b82f6"
        barProgressSelectedColor="#2563eb"
        barBackgroundColor="#93c5fd"
        barBackgroundSelectedColor="#60a5fa"
        milestoneBackgroundColor="#8b5cf6"
        milestoneBackgroundSelectedColor="#7c3aed"
        arrowColor="#94a3b8"
      />
    </div>
  );
}
