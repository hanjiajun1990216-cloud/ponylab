"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Users, Plus, Globe, Lock, KeyRound } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createSchema = z.object({
  name: z.string().min(1, "请输入团队名称"),
  description: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "INVITE_ONLY"]),
});

type CreateForm = z.infer<typeof createSchema>;

const visibilityIcon: Record<string, any> = {
  PUBLIC: Globe,
  PRIVATE: Lock,
  INVITE_ONLY: KeyRound,
};

const visibilityLabel: Record<string, string> = {
  PUBLIC: "公开",
  PRIVATE: "私密",
  INVITE_ONLY: "仅邀请",
};

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.getTeams(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { visibility: "PRIVATE" },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => api.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setShowCreate(false);
      reset();
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">团队管理</h1>
          <p className="mt-1 text-sm text-gray-600">管理您的研究团队和成员</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          创建团队
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : !teams || teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="暂无团队"
          description="创建您的第一个研究团队，开始协作"
          action={{ label: "创建团队", onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team: any) => {
            const VisIcon = visibilityIcon[team.visibility] || Lock;
            return (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <VisIcon className="h-3 w-3" />
                    {visibilityLabel[team.visibility] || "私密"}
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {team.name}
                </h3>
                {team.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{team.description}</p>
                )}

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.members?.length || team._count?.members || 0} 位成员
                  </span>
                  <span>{team._count?.projects || 0} 个项目</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="创建团队">
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">团队名称 *</label>
            <input
              {...register("name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="例如：蛋白质组学研究团队"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="团队简介（可选）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">可见性</label>
            <select
              {...register("visibility")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="PUBLIC">公开 — 任何人可见</option>
              <option value="PRIVATE">私密 — 仅成员可见</option>
              <option value="INVITE_ONLY">仅邀请 — 需要邀请码</option>
            </select>
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
