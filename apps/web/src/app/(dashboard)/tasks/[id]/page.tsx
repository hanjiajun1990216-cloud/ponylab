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
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];

export default function TaskDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [newStepName, setNewStepName] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);
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

  const toggleStep = useMutation({
    mutationFn: ({ stepId, completed }: { stepId: string; completed: boolean }) =>
      api.updateTaskStep(id, stepId, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", id] }),
  });

  const addStep = useMutation({
    mutationFn: (name: string) => api.createTaskStep(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      setNewStepName("");
      setShowAddStep(false);
    },
  });

  const deleteStep = useMutation({
    mutationFn: (stepId: string) => api.deleteTaskStep(id, stepId),
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
  if (!task) return <div className="text-center py-12 text-gray-500">任务不存在</div>;

  const completedSteps = task.steps?.filter((s: any) => s.completed).length || 0;
  const totalSteps = task.steps?.length || 0;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        {task.project && (
          <Link href={`/projects/${task.project.id}`} className="flex items-center gap-1 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            {task.project.name}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Task Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title & Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-xl font-bold text-slate-900 flex-1 mr-4">{task.name}</h1>
              <select
                value={task.status}
                onChange={(e) => updateTask.mutate({ status: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mb-4">{task.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">负责人</div>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      firstName={task.assignee.firstName}
                      lastName={task.assignee.lastName}
                      userId={task.assignee.id}
                      size="sm"
                    />
                    <span className="text-gray-800">{task.assignee.firstName} {task.assignee.lastName}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">未分配</span>
                )}
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">截止日期</div>
                {task.dueDate ? (
                  <span className={`flex items-center gap-1 text-sm ${
                    new Date(task.dueDate) < new Date() ? "text-red-600" : "text-gray-700"
                  }`}>
                    <Calendar className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString("zh-CN")}
                  </span>
                ) : (
                  <span className="text-gray-400">未设置</span>
                )}
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-gray-600" />
                <h2 className="font-semibold text-slate-900">执行步骤</h2>
                {totalSteps > 0 && (
                  <span className="text-sm text-gray-500">({completedSteps}/{totalSteps})</span>
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
                    onClick={() => toggleStep.mutate({ stepId: step.id, completed: !step.completed })}
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      step.completed
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                  >
                    {step.completed && <Check className="h-3 w-3" />}
                  </button>
                  <span className={`flex-1 text-sm ${step.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
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
                      if (e.key === "Enter" && newStepName.trim()) addStep.mutate(newStepName);
                      if (e.key === "Escape") { setShowAddStep(false); setNewStepName(""); }
                    }}
                    placeholder="步骤名称... (Enter 确认, Esc 取消)"
                    className="flex-1 bg-transparent text-sm outline-none"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Comments + Participants */}
        <div className="space-y-4">
          {/* Participants */}
          {task.participants && task.participants.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                参与人
              </h3>
              <div className="space-y-2">
                {task.participants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar firstName={p.firstName} lastName={p.lastName} userId={p.id} size="sm" />
                    <span className="text-sm text-gray-700">{p.firstName} {p.lastName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
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
                      <div className="text-sm text-gray-800 mt-0.5">{c.content}</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 px-1">
                      {new Date(c.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                </div>
              ))}
              {(!comments || comments.length === 0) && (
                <p className="text-xs text-gray-400 text-center py-4">暂无留言</p>
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
    </div>
  );
}
