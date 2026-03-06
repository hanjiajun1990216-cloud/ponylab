"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  Calendar,
  User,
  MessageSquare,
  CheckSquare,
  FlaskConical,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];

type TabId = "details" | "protocol-execution" | "steps";

const STEP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  SKIPPED: "bg-yellow-100 text-yellow-700",
};

const STEP_STATUS_LABELS: Record<string, string> = {
  PENDING: "待执行",
  IN_PROGRESS: "执行中",
  COMPLETED: "已完成",
  SKIPPED: "已跳过",
};

// ─── Protocol Execution Tab ───────────────────────────────────────────────────

function ProtocolExecutionTab({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [showStartModal, setShowStartModal] = useState(false);
  const [protocolId, setProtocolId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(
    {},
  );

  const {
    data: execution,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["protocol-execution", taskId],
    queryFn: () => api.getProtocolExecution(taskId),
    retry: false,
  });

  const { data: protocols } = useQuery({
    queryKey: ["protocols"],
    queryFn: () => api.getProtocols(),
    enabled: showStartModal,
  });

  const startExecution = useMutation({
    mutationFn: () =>
      api.startProtocolExecution(taskId, { protocolId, versionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["protocol-execution", taskId],
      });
      setShowStartModal(false);
      setProtocolId("");
      setVersionId("");
    },
  });

  const updateStep = useMutation({
    mutationFn: ({
      stepId,
      data,
    }: {
      stepId: string;
      data: { status?: string; notes?: string; deviations?: string };
    }) => api.updateExecutionStep(execution.id, stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["protocol-execution", taskId],
      });
    },
  });

  const completeExecution = useMutation({
    mutationFn: () => api.completeProtocolExecution(execution.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["protocol-execution", taskId],
      });
    },
  });

  const toggleExpand = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  if (isLoading) return <LoadingSpinner />;

  // No execution exists yet
  if (error || !execution) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FlaskConical className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-base font-semibold text-gray-700 mb-2">
          尚未启动方案执行
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          选择一个实验方案并关联至该任务，开始执行步骤记录
        </p>
        <button
          onClick={() => setShowStartModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          启动方案执行
        </button>

        <Modal
          open={showStartModal}
          onClose={() => setShowStartModal(false)}
          title="启动方案执行"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Protocol ID *
              </label>
              <input
                value={protocolId}
                onChange={(e) => setProtocolId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="输入 Protocol ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version ID *
              </label>
              <input
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="输入 Protocol Version ID"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => startExecution.mutate()}
                disabled={
                  !protocolId.trim() ||
                  !versionId.trim() ||
                  startExecution.isPending
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {startExecution.isPending ? "启动中..." : "启动执行"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Execution exists — show step checklist
  const allDone = execution.steps.every(
    (s: any) => s.status === "COMPLETED" || s.status === "SKIPPED",
  );
  const completedCount = execution.steps.filter(
    (s: any) => s.status === "COMPLETED" || s.status === "SKIPPED",
  ).length;

  return (
    <div className="space-y-4">
      {/* Execution Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">方案执行记录</h3>
              {execution.completedAt ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <Check className="h-3 w-3" />
                  已完成
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  进行中
                </span>
              )}
            </div>
            {execution.protocol && (
              <p className="text-xs text-gray-500 mt-0.5">
                方案：{execution.protocol.name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">
              {completedCount}/{execution.steps.length}
            </div>
            <div className="text-xs text-gray-500">步骤完成</div>
          </div>
        </div>

        {execution.steps.length > 0 && (
          <div className="h-1.5 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${(completedCount / execution.steps.length) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Step Checklist */}
      {execution.steps.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          该方案版本暂无步骤定义
        </div>
      ) : (
        <div className="space-y-2">
          {execution.steps.map((step: any) => (
            <div
              key={step.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  {step.stepIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STEP_STATUS_COLORS[step.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {STEP_STATUS_LABELS[step.status] ?? step.status}
                    </span>
                    {step.executor && (
                      <span className="text-xs text-gray-400">
                        by {step.executor.firstName} {step.executor.lastName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                {!execution.completedAt && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {step.status !== "IN_PROGRESS" && (
                      <button
                        onClick={() =>
                          updateStep.mutate({
                            stepId: step.id,
                            data: { status: "IN_PROGRESS" },
                          })
                        }
                        disabled={updateStep.isPending}
                        className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                      >
                        开始执行
                      </button>
                    )}
                    {step.status !== "COMPLETED" && (
                      <button
                        onClick={() =>
                          updateStep.mutate({
                            stepId: step.id,
                            data: { status: "COMPLETED" },
                          })
                        }
                        disabled={updateStep.isPending}
                        className="rounded-md bg-green-50 px-2 py-1 text-xs text-green-600 hover:bg-green-100 disabled:opacity-50"
                      >
                        标记完成
                      </button>
                    )}
                    {step.status !== "SKIPPED" && (
                      <button
                        onClick={() =>
                          updateStep.mutate({
                            stepId: step.id,
                            data: { status: "SKIPPED" },
                          })
                        }
                        disabled={updateStep.isPending}
                        className="rounded-md bg-yellow-50 px-2 py-1 text-xs text-yellow-600 hover:bg-yellow-100 disabled:opacity-50"
                      >
                        跳过
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => toggleExpand(step.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                >
                  {expandedSteps[step.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {expandedSteps[step.id] && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3 pt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      备注
                    </label>
                    <textarea
                      defaultValue={step.notes ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (step.notes ?? "")) {
                          updateStep.mutate({
                            stepId: step.id,
                            data: { notes: e.target.value },
                          });
                        }
                      }}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="添加备注..."
                      disabled={!!execution.completedAt}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-red-500 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      偏差记录
                    </label>
                    <textarea
                      defaultValue={step.deviations ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (step.deviations ?? "")) {
                          updateStep.mutate({
                            stepId: step.id,
                            data: { deviations: e.target.value },
                          });
                        }
                      }}
                      rows={2}
                      className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
                      placeholder="记录与标准方案的偏差..."
                      disabled={!!execution.completedAt}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Complete Execution Button */}
      {!execution.completedAt && execution.steps.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => completeExecution.mutate()}
            disabled={!allDone || completeExecution.isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title={!allDone ? "所有步骤完成或跳过后才能结束执行" : undefined}
          >
            <Check className="h-4 w-4" />
            {completeExecution.isPending ? "完成中..." : "结束执行"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Steps Tab ────────────────────────────────────────────────────────────────

function StepsTab({ task, taskId }: { task: any; taskId: string }) {
  const queryClient = useQueryClient();
  const [newStepName, setNewStepName] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);

  const toggleStep = useMutation({
    mutationFn: ({
      stepId,
      completed,
    }: {
      stepId: string;
      completed: boolean;
    }) => api.updateTaskStep(taskId, stepId, { completed }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const addStep = useMutation({
    mutationFn: (name: string) => api.createTaskStep(taskId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setNewStepName("");
      setShowAddStep(false);
    },
  });

  const deleteStep = useMutation({
    mutationFn: (stepId: string) => api.deleteTaskStep(taskId, stepId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const completedSteps =
    task.steps?.filter((s: any) => s.completed).length || 0;
  const totalSteps = task.steps?.length || 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-slate-900">执行步骤</h2>
          {totalSteps > 0 && (
            <span className="text-sm text-gray-500">
              ({completedSteps}/{totalSteps})
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAddStep(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          添加步骤
        </button>
      </div>

      {totalSteps > 0 && (
        <div className="mb-3 h-1.5 rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-2">
        {task.steps?.map((step: any) => (
          <div
            key={step.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 group"
          >
            <button
              onClick={() =>
                toggleStep.mutate({
                  stepId: step.id,
                  completed: !step.completed,
                })
              }
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                step.completed
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-300 hover:border-green-400"
              }`}
            >
              {step.completed && <Check className="h-3 w-3" />}
            </button>
            <span
              className={`flex-1 text-sm ${step.completed ? "line-through text-gray-400" : "text-gray-800"}`}
            >
              {step.name}
            </span>
            <button
              onClick={() => deleteStep.mutate(step.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {task.steps?.length === 0 && !showAddStep && (
          <p className="text-sm text-gray-400 text-center py-4">
            暂无步骤，点击「添加步骤」开始规划
          </p>
        )}

        {showAddStep && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
            <input
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newStepName.trim())
                  addStep.mutate(newStepName);
                if (e.key === "Escape") {
                  setShowAddStep(false);
                  setNewStepName("");
                }
              }}
              placeholder="步骤名称... (Enter 确认, Esc 取消)"
              className="flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [comment, setComment] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => api.getTask(id),
  });

  const { data: comments } = useQuery({
    queryKey: ["comments-task", id],
    queryFn: () => api.getCommentsByTask(id),
  });

  const updateTask = useMutation({
    mutationFn: (data: any) => api.updateTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", id] }),
  });

  const addComment = useMutation({
    mutationFn: (content: string) => api.createComment({ content, taskId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments-task", id] });
      setComment("");
    },
  });

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!task)
    return <div className="text-center py-12 text-gray-500">任务不存在</div>;

  const tabs: { id: TabId; label: string }[] = [
    { id: "details", label: "详情" },
    { id: "protocol-execution", label: "方案执行" },
    { id: "steps", label: "步骤" },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        {task.project && (
          <Link
            href={`/projects/${task.project.id}`}
            className="flex items-center gap-1 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {task.project.name}
          </Link>
        )}
      </div>

      {/* Task Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-4">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900 flex-1 mr-4">
            {task.name}
          </h1>
          <select
            value={task.status}
            onChange={(e) => updateTask.mutate({ status: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 mb-4">{task.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              负责人
            </div>
            {task.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar
                  firstName={task.assignee.firstName}
                  lastName={task.assignee.lastName}
                  userId={task.assignee.id}
                  size="sm"
                />
                <span className="text-gray-800">
                  {task.assignee.firstName} {task.assignee.lastName}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">未分配</span>
            )}
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              截止日期
            </div>
            {task.dueDate ? (
              <span
                className={`flex items-center gap-1 text-sm ${
                  new Date(task.dueDate) < new Date()
                    ? "text-red-600"
                    : "text-gray-700"
                }`}
              >
                {new Date(task.dueDate).toLocaleDateString("zh-CN")}
              </span>
            ) : (
              <span className="text-gray-400">未设置</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Participants */}
              {task.participants && task.participants.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    参与人
                  </h3>
                  <div className="space-y-2">
                    {task.participants.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Avatar
                          firstName={p.firstName}
                          lastName={p.lastName}
                          userId={p.id}
                          size="sm"
                        />
                        <span className="text-sm text-gray-700">
                          {p.firstName} {p.lastName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task metadata placeholder */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-500">
                <p>
                  创建时间：
                  {task.createdAt
                    ? new Date(task.createdAt).toLocaleString("zh-CN")
                    : "—"}
                </p>
                {task.updatedAt && (
                  <p className="mt-1">
                    更新时间：
                    {new Date(task.updatedAt).toLocaleString("zh-CN")}
                  </p>
                )}
              </div>
            </div>

            {/* Comments */}
            <div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  留言区
                </h3>

                <div className="space-y-3 mb-3 max-h-80 overflow-y-auto">
                  {comments?.map((c: any) => (
                    <div key={c.id} className="flex gap-2">
                      <Avatar
                        firstName={c.author?.firstName}
                        lastName={c.author?.lastName}
                        userId={c.author?.id}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="rounded-lg bg-gray-50 p-2">
                          <div className="text-xs font-medium text-gray-700">
                            {c.author?.firstName} {c.author?.lastName}
                          </div>
                          <div className="text-sm text-gray-800 mt-0.5">
                            {c.content}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 px-1">
                          {new Date(c.createdAt).toLocaleString("zh-CN")}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!comments || comments.length === 0) && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      暂无留言
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && comment.trim()) {
                        e.preventDefault();
                        addComment.mutate(comment);
                      }
                    }}
                    placeholder="添加留言..."
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => comment.trim() && addComment.mutate(comment)}
                    disabled={!comment.trim() || addComment.isPending}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    发送
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "protocol-execution" && (
          <ProtocolExecutionTab taskId={id} />
        )}

        {activeTab === "steps" && <StepsTab task={task} taskId={id} />}
      </div>
    </div>
  );
}
