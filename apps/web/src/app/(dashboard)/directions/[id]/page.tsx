"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  FolderKanban,
  User,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  name: z.string().min(1, "请输入项目名称"),
  description: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

export default function DirectionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: direction, isLoading: loadingDir } = useQuery({
    queryKey: ["direction", id],
    queryFn: () => api.getDirection(id),
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects-direction", id],
    queryFn: () => api.getProjectsByDirection(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) =>
      api.createProject({
        ...data,
        teamId: direction?.teamId,
        directionId: id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-direction", id] });
      setShowCreate(false);
      reset();
    },
  });

  if (loadingDir) return <LoadingSpinner fullPage />;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/directions"
          className="flex items-center gap-1 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          研究方向
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{direction?.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {direction?.name}
          </h1>
          {direction?.description && (
            <p className="mt-1 text-sm text-gray-600">
              {direction.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            {direction?.leader && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                负责人: {direction.leader.firstName} {direction.leader.lastName}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新建项目
        </button>
      </div>

      {/* Projects Grid */}
      {loadingProjects ? (
        <LoadingSpinner fullPage />
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="该方向下暂无项目"
          description="创建第一个项目，开始您的研究"
          action={{ label: "新建项目", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => {
            const totalTasks = project._count?.tasks || 0;
            const completedTasks = project.completedTasks || 0;
            const progress =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <Badge
                    label={project.status || "ACTIVE"}
                    status={project.status || "ACTIVE"}
                  />
                </div>

                {project.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>进度</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {project.leader && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {project.leader.firstName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {totalTasks} 任务
                  </span>
                  {project.endDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.endDate).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          reset();
        }}
        title="新建项目"
      >
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              项目名称 *
            </label>
            <input
              {...register("name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="输入项目名称"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="项目简介（可选）"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                reset();
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "创建中..." : "创建"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
