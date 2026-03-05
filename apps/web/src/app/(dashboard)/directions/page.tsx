"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import Link from "next/link";
import { Compass, Plus, FolderKanban, User } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  name: z.string().min(1, "请输入方向名称"),
  description: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

export default function DirectionsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.getTeams(),
  });

  const firstTeamId = teams?.[0]?.id;

  const { data: directions, isLoading } = useQuery({
    queryKey: ["directions", firstTeamId],
    queryFn: () => api.getDirections(firstTeamId),
    enabled: !!firstTeamId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) =>
      api.createDirection({ ...data, teamId: firstTeamId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directions"] });
      setShowCreate(false);
      reset();
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">研究方向</h1>
          <p className="mt-1 text-sm text-gray-600">管理团队研究方向和项目分类</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          disabled={!firstTeamId}
        >
          <Plus className="h-4 w-4" />
          新建方向
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : !directions || directions.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="暂无研究方向"
          description="创建第一个研究方向，开始组织您的项目"
          action={{ label: "新建方向", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {directions.map((dir: any) => (
            <Link
              key={dir.id}
              href={`/directions/${dir.id}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Compass className="h-5 w-5" />
                </div>
                <Badge
                  label={dir.status || "ACTIVE"}
                  status={dir.status || "ACTIVE"}
                />
              </div>

              <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {dir.name}
              </h3>
              {dir.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{dir.description}</p>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                {dir.leader && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {dir.leader.firstName} {dir.leader.lastName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" />
                  {dir._count?.projects || 0} 个项目
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="新建研究方向">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">方向名称 *</label>
            <input
              {...register("name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="例如：蛋白质折叠研究"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="简要描述这个研究方向..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowCreate(false); reset(); }}
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
