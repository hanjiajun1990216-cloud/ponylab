"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FlaskConical, Plus, Filter, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";

const ALL_STATUSES = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "SIGNED",
  "ARCHIVED",
];

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  SIGNED: "已签署",
  ARCHIVED: "已归档",
};

export default function ExperimentsPage() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.getTeams(),
  });

  const firstTeam = teams?.[0];

  const { data: projects } = useQuery({
    queryKey: ["projects", firstTeam?.id],
    queryFn: () => api.getProjectsByTeam(firstTeam!.id),
    enabled: !!firstTeam?.id,
  });

  const projectId = selectedProject || projects?.data?.[0]?.id;

  const { data: experiments, isLoading } = useQuery({
    queryKey: ["experiments", projectId, statusFilter],
    queryFn: () => api.getExperimentsByProject(projectId!),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      api.createExperiment({ title, projectId: projectId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      setShowCreate(false);
      setNewTitle("");
    },
  });

  // Filter by status client-side
  const filteredExperiments = statusFilter
    ? experiments?.data?.filter((e: any) => e.status === statusFilter)
    : experiments?.data;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">实验记录</h1>
          <p className="mt-1 text-sm text-gray-600">管理实验记录和数据</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          disabled={!projectId}
        >
          <Plus className="h-4 w-4" />
          新建记录
        </button>
      </div>

      {/* Project Filter Tabs */}
      {projects?.data && projects.data.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedProject(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !selectedProject
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            全部项目
          </button>
          {projects.data.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedProject === p.id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1">
          <button
            onClick={() => setStatusFilter("")}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              !statusFilter
                ? "bg-slate-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            全部
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === statusFilter ? "" : s)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-slate-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Experiments List */}
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : filteredExperiments?.length > 0 ? (
        <div className="space-y-3">
          {filteredExperiments.map((exp: any) => (
            <Link
              key={exp.id}
              href={`/experiments/${exp.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {exp.title}
                    </h3>
                    {exp.status === "SIGNED" && (
                      <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {exp.author && (
                      <div className="flex items-center gap-1">
                        <Avatar
                          firstName={exp.author.firstName}
                          lastName={exp.author.lastName}
                          userId={exp.author.id}
                          size="sm"
                        />
                        <span>
                          {exp.author.firstName} {exp.author.lastName}
                        </span>
                      </div>
                    )}
                    <span>·</span>
                    <span>
                      更新于{" "}
                      {new Date(exp.updatedAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
                <Badge
                  label={statusLabel[exp.status] || exp.status}
                  status={exp.status}
                />
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                <span>{exp._count?.tasks || 0} 个任务</span>
                <span>{exp._count?.results || 0} 个结果</span>
                <span>{exp._count?.files || 0} 个文件</span>
              </div>
              {exp.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {exp.tags.map((t: any) => (
                    <span
                      key={t.id}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {t.tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FlaskConical}
          title="暂无实验记录"
          description={
            statusFilter
              ? `没有状态为"${statusLabel[statusFilter]}"的记录`
              : "创建第一个实验记录"
          }
          action={
            !statusFilter
              ? { label: "新建记录", onClick: () => setShowCreate(true) }
              : undefined
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setNewTitle("");
        }}
        title="新建实验记录"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 *
            </label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="实验标题..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim())
                  createMutation.mutate(newTitle);
              }}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowCreate(false);
                setNewTitle("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={() => newTitle.trim() && createMutation.mutate(newTitle)}
              disabled={!newTitle.trim() || createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "创建中..." : "创建"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
