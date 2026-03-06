"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  LayoutTemplate,
  Plus,
  Globe,
  Lock,
  User,
  Calendar,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";

export default function ExperimentTemplatesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [isPublicFilter, setIsPublicFilter] = useState<boolean | undefined>(
    undefined,
  );

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    isPublic: false,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.getTeams(),
  });

  const firstTeam = teams?.[0];

  const { data: templates, isLoading } = useQuery({
    queryKey: ["experiment-templates", firstTeam?.id, isPublicFilter],
    queryFn: () => api.getExperimentTemplates(firstTeam?.id, isPublicFilter),
    enabled: !!firstTeam?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.createExperimentTemplate({
        ...data,
        teamId: firstTeam!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiment-templates"] });
      setShowCreate(false);
      setForm({ name: "", description: "", category: "", isPublic: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteExperimentTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiment-templates"] });
    },
  });

  const handleSubmit = () => {
    if (!form.name.trim() || !firstTeam?.id) return;
    createMutation.mutate(form);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">实验模板库</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理和复用实验模板，加速实验记录创建
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          disabled={!firstTeam?.id}
        >
          <Plus className="h-4 w-4" />
          创建模板
        </button>
      </div>

      {/* 过滤 Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setIsPublicFilter(undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            isPublicFilter === undefined
              ? "bg-slate-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setIsPublicFilter(true)}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            isPublicFilter === true
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Globe className="h-3 w-3" />
          公开模板
        </button>
        <button
          onClick={() => setIsPublicFilter(false)}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            isPublicFilter === false
              ? "bg-slate-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Lock className="h-3 w-3" />
          团队私有
        </button>
      </div>

      {/* 模板列表 */}
      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl: any) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <h3 className="font-semibold text-slate-900 truncate">
                      {tpl.name}
                    </h3>
                  </div>
                  {tpl.category && (
                    <span className="mt-1 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                      {tpl.category}
                    </span>
                  )}
                </div>
                <span
                  className={`ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    tpl.isPublic
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tpl.isPublic ? (
                    <span className="flex items-center gap-0.5">
                      <Globe className="h-3 w-3" />
                      公开
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Lock className="h-3 w-3" />
                      私有
                    </span>
                  )}
                </span>
              </div>

              {tpl.description && (
                <p className="mb-3 text-sm text-gray-500 line-clamp-2">
                  {tpl.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-400">
                {tpl.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>
                      {tpl.author.firstName} {tpl.author.lastName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(tpl.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    if (
                      confirm(`确定删除模板"${tpl.name}"吗？此操作不可撤销。`)
                    ) {
                      deleteMutation.mutate(tpl.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="rounded-md px-3 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={LayoutTemplate}
          title="暂无实验模板"
          description="创建模板以加速实验记录流程"
          action={{ label: "创建模板", onClick: () => setShowCreate(true) }}
        />
      )}

      {/* 创建模板 Modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setForm({ name: "", description: "", category: "", isPublic: false });
        }}
        title="创建实验模板"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模板名称 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="输入模板名称..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
              placeholder="模板用途说明..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="例：细胞实验、分子生物学..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.isPublic}
              onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                form.isPublic ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-700">
                {form.isPublic ? "公开模板" : "团队私有"}
              </span>
              <p className="text-xs text-gray-500">
                {form.isPublic
                  ? "所有团队成员均可查看此模板"
                  : "仅本团队成员可见"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowCreate(false);
                setForm({
                  name: "",
                  description: "",
                  category: "",
                  isPublic: false,
                });
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? "创建中..." : "创建模板"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
