"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  LayoutGrid,
  List,
  Kanban,
  GanttChart,
  User,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { Avatar, AvatarGroup } from "@/components/Avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { GanttView } from "@/components/GanttView";

// Reactflow imports
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

// DnD Kit imports
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

type ViewMode = "canvas" | "list" | "board" | "gantt";

// ─── Custom Task Node for ReactFlow ───────────────────────────────────────────

function TaskNode({ data }: { data: any }) {
  const dueDate = data.dueDate ? new Date(data.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const isSoon =
    dueDate &&
    !isOverdue &&
    dueDate.getTime() - Date.now() < 3 * 24 * 3600 * 1000;

  const completedSteps =
    data.steps?.filter((s: any) => s.completed).length || 0;
  const totalSteps = data.steps?.length || 0;

  return (
    <div
      className={`bg-white rounded-lg border-2 shadow-sm p-3 w-52 cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue
          ? "border-red-300"
          : isSoon
            ? "border-yellow-300"
            : "border-gray-200"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 hover:!bg-blue-500 !border-2 !border-white"
      />
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/tasks/${data.id}`}
          className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-2 flex-1"
        >
          {data.label}
        </Link>
        <Badge label={data.status} status={data.status} />
      </div>

      {totalSteps > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>步骤</span>
            <span>
              {completedSteps}/{totalSteps}
            </span>
          </div>
          <div className="h-1 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{
                width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {data.assignee ? (
          <Avatar
            firstName={data.assignee.firstName}
            lastName={data.assignee.lastName}
            userId={data.assignee.id}
            size="sm"
          />
        ) : (
          <div className="h-6 w-6" />
        )}
        {dueDate && (
          <span
            className={`text-xs ${isOverdue ? "text-red-600 font-medium" : isSoon ? "text-yellow-600" : "text-gray-400"}`}
          >
            {dueDate.toLocaleDateString("zh-CN", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 hover:!bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { taskNode: TaskNode };

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanCard({
  task,
  isDragging,
}: {
  task: any;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${isDragging ? "opacity-50 shadow-lg ring-2 ring-blue-400" : ""}`}
    >
      <Link
        href={`/tasks/${task.id}`}
        className="block"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-medium text-slate-900 mb-2">
          {task.title}
        </div>
        {task.assignee && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Avatar
              firstName={task.assignee.firstName}
              lastName={task.assignee.lastName}
              userId={task.assignee.id}
              size="sm"
            />
            <span>{task.assignee.firstName}</span>
          </div>
        )}
        {task.dueDate && (
          <div className="mt-1 text-xs text-gray-400">
            {new Date(task.dueDate).toLocaleDateString("zh-CN")}
          </div>
        )}
      </Link>
    </div>
  );
}

function DraggableKanbanCard({ task }: { task: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status, task },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <KanbanCard task={task} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({
  title,
  status,
  tasks,
}: {
  title: string;
  status: string;
  tasks: any[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl p-3 min-h-48 transition-colors ${isOver ? "bg-blue-50 ring-2 ring-blue-300" : "bg-gray-100"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 flex-1">
          {tasks.map((task) => (
            <DraggableKanbanCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Comment Panel ─────────────────────────────────────────────────────────────

function CommentPanel({ projectId }: { projectId: string }) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ["comments-project", projectId],
    queryFn: () => api.getCommentsByProject(projectId),
  });

  const addComment = useMutation({
    mutationFn: (text: string) =>
      api.createComment({ content: text, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments-project", projectId],
      });
      setContent("");
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {comments?.map((c: any) => (
          <div key={c.id} className="flex gap-2">
            <Avatar
              firstName={c.author?.firstName}
              lastName={c.author?.lastName}
              userId={c.author?.id}
              size="sm"
            />
            <div className="flex-1 rounded-lg bg-gray-50 p-2">
              <div className="text-xs font-medium text-gray-700">
                {c.author?.firstName} {c.author?.lastName}
              </div>
              <div className="text-sm text-gray-800 mt-0.5">{c.content}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(c.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
          </div>
        ))}
        {(!comments || comments.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-4">暂无留言</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && content.trim()) {
              e.preventDefault();
              addComment.mutate(content);
            }
          }}
          placeholder="留言... (Enter 发送)"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={() => content.trim() && addComment.mutate(content)}
          disabled={!content.trim() || addComment.isPending}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [editMode, setEditMode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [activeKanbanTask, setActiveKanbanTask] = useState<any>(null);

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.getProject(id),
  });

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks-project", id],
    queryFn: () => api.getTasksByProject(id),
  });

  // Build ReactFlow nodes/edges from tasks
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  useMemo(() => {
    if (!tasks) return;
    const nodes: Node[] = tasks.map((task: any, i: number) => ({
      id: task.id,
      type: "taskNode",
      position:
        task.posX != null
          ? { x: task.posX, y: task.posY }
          : { x: (i % 4) * 280 + 40, y: Math.floor(i / 4) * 180 + 40 },
      data: {
        id: task.id,
        label: task.title,
        status: task.status,
        assignee: task.assignee,
        dueDate: task.dueDate,
        steps: task.steps || [],
      },
    }));

    const edges: Edge[] = [];
    tasks.forEach((task: any) => {
      task.dependsOn?.forEach((dep: any) => {
        edges.push({
          id: `dep-${dep.upstreamTaskId}-${task.id}`,
          source: dep.upstreamTaskId,
          target: task.id,
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        });
      });
    });

    setRfNodes(nodes);
    setRfEdges(edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.updateTask(taskId, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tasks-project", id] }),
  });

  const createTask = useMutation({
    mutationFn: (name: string) => api.createTask({ name, projectId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-project", id] });
      setShowCreateTask(false);
      setNewTaskName("");
    },
  });

  const onNodeDragStop = useCallback(async (_: any, node: Node) => {
    await api.updateTaskPosition(node.id, {
      x: node.position.x,
      y: node.position.y,
    });
  }, []);

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setRfEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: false,
            style: { stroke: "#94a3b8", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
          },
          eds,
        ),
      );
      await api.addTaskDependency(connection.target, connection.source);
      queryClient.invalidateQueries({ queryKey: ["tasks-project", id] });
    },
    [id, queryClient, setRfEdges],
  );

  const kanbanSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleKanbanDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task;
    setActiveKanbanTask(task || null);
  }, []);

  const handleKanbanDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveKanbanTask(null);
      const { active, over } = event;
      if (!over) return;
      const overId = over.id as string;
      const oldStatus = active.data.current?.status;
      const newStatus = ["TODO", "IN_PROGRESS", "DONE"].includes(overId)
        ? overId
        : over.data.current?.status;
      if (newStatus && oldStatus !== newStatus) {
        updateTaskStatus.mutate({
          taskId: active.id as string,
          status: newStatus,
        });
      }
    },
    [updateTaskStatus],
  );

  if (loadingProject) return <LoadingSpinner fullPage />;

  const todoTasks = tasks?.filter((t: any) => t.status === "TODO") || [];
  const inProgressTasks =
    tasks?.filter((t: any) => t.status === "IN_PROGRESS") || [];
  const doneTasks =
    tasks?.filter(
      (t: any) => t.status === "DONE" || t.status === "COMPLETED",
    ) || [];

  const totalTasks = tasks?.length || 0;
  const completedTasks = doneTasks.length;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/directions"
          className="flex items-center gap-1 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        {project?.direction && (
          <>
            <span>/</span>
            <Link
              href={`/directions/${project.direction.id}`}
              className="hover:text-gray-700"
            >
              {project.direction.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 font-medium">{project?.name}</span>
      </div>

      {/* Project Header */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">
                {project?.name}
              </h1>
              <Badge
                label={project?.status || "ACTIVE"}
                status={project?.status || "ACTIVE"}
              />
            </div>
            {project?.description && (
              <p className="text-sm text-gray-600 mb-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-6 text-xs text-gray-500">
              {project?.leader && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {project.leader.firstName} {project.leader.lastName}
                </span>
              )}
              {project?.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.endDate).toLocaleDateString("zh-CN")}
                </span>
              )}
              <span>{totalTasks} 个任务</span>
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-blue-600">{progress}%</div>
            <div className="text-xs text-gray-500">完成度</div>
            <div className="mt-1 h-1.5 w-24 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs + Add Task */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[
            { mode: "canvas" as ViewMode, icon: LayoutGrid, label: "画布" },
            { mode: "list" as ViewMode, icon: List, label: "列表" },
            { mode: "board" as ViewMode, icon: Kanban, label: "看板" },
            { mode: "gantt" as ViewMode, icon: GanttChart, label: "甘特图" },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === mode
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreateTask(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新建任务
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {loadingTasks ? (
          <LoadingSpinner fullPage />
        ) : viewMode === "canvas" ? (
          <div className="h-96 rounded-xl border border-gray-200 bg-white overflow-hidden relative">
            {/* Edit mode toggle */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  editMode
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {editMode ? "完成编辑" : "编辑工作流"}
              </button>
            </div>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={editMode ? onNodesChange : undefined}
              onEdgesChange={editMode ? onEdgesChange : undefined}
              onNodeDragStop={editMode ? onNodeDragStop : undefined}
              onConnect={editMode ? onConnect : undefined}
              nodeTypes={nodeTypes}
              nodesDraggable={editMode}
              nodesConnectable={editMode}
              elementsSelectable={editMode}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background color="#f1f5f9" gap={20} />
              <Controls />
              <MiniMap nodeStrokeWidth={3} zoomable pannable />
            </ReactFlow>
          </div>
        ) : viewMode === "board" ? (
          <DndContext
            sensors={kanbanSensors}
            collisionDetection={closestCorners}
            onDragStart={handleKanbanDragStart}
            onDragEnd={handleKanbanDragEnd}
          >
            <div className="grid grid-cols-3 gap-4">
              <KanbanColumn title="待办" status="TODO" tasks={todoTasks} />
              <KanbanColumn
                title="进行中"
                status="IN_PROGRESS"
                tasks={inProgressTasks}
              />
              <KanbanColumn title="已完成" status="DONE" tasks={doneTasks} />
            </div>
            <DragOverlay>
              {activeKanbanTask ? (
                <KanbanCard task={activeKanbanTask} />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : viewMode === "gantt" ? (
          <GanttView
            tasks={tasks || []}
            onTaskUpdate={() =>
              queryClient.invalidateQueries({
                queryKey: ["tasks-project", id],
              })
            }
          />
        ) : (
          // List view
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">任务名称</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">负责人</th>
                  <th className="px-4 py-3">截止日期</th>
                  <th className="px-4 py-3">步骤</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks?.map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={task.status} status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            firstName={task.assignee.firstName}
                            lastName={task.assignee.lastName}
                            userId={task.assignee.id}
                            size="sm"
                          />
                          <span className="text-gray-700">
                            {task.assignee.firstName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("zh-CN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {task.steps?.length > 0
                        ? `${task.steps.filter((s: any) => s.completed).length}/${task.steps.length}`
                        : "—"}
                    </td>
                  </tr>
                ))}
                {(!tasks || tasks.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      暂无任务
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comment Panel (collapsible) */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            项目留言
          </span>
          {showComments ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {showComments && (
          <div className="px-4 pb-4 h-64">
            <CommentPanel projectId={id} />
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        open={showCreateTask}
        onClose={() => {
          setShowCreateTask(false);
          setNewTaskName("");
        }}
        title="新建任务"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务名称 *
            </label>
            <input
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="输入任务名称"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTaskName.trim())
                  createTask.mutate(newTaskName);
              }}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowCreateTask(false);
                setNewTaskName("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={() =>
                newTaskName.trim() && createTask.mutate(newTaskName)
              }
              disabled={!newTaskName.trim() || createTask.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createTask.isPending ? "创建中..." : "创建"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
