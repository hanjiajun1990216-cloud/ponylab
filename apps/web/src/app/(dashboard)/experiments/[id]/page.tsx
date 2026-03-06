"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import AIAssistantPanel from "@/components/AIAssistantPanel";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  PenLine,
  Send,
  Download,
  History,
  CheckCircle2,
  ChevronDown,
  Clock,
  FlaskConical,
  Paperclip,
  TestTube2,
  ClipboardList,
  AlertCircle,
} from "lucide-react";

// 动态加载 ELNEditor（避免 SSR 问题，TipTap 依赖浏览器 DOM）
const ELNEditor = dynamic(() => import("@/components/ELNEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-gray-400">
      <LoadingSpinner />
    </div>
  ),
});

const statusLabel: Record<string, string> = {
  DRAFT: "草稿",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  SIGNED: "已签署",
  ARCHIVED: "已归档",
};

type TabKey = "editor" | "tasks" | "results" | "samples" | "files" | "history";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "editor", label: "实验记录", icon: <PenLine className="h-4 w-4" /> },
  {
    key: "tasks",
    label: "关联任务",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    key: "results",
    label: "实验结果",
    icon: <TestTube2 className="h-4 w-4" />,
  },
  {
    key: "samples",
    label: "关联样品",
    icon: <FlaskConical className="h-4 w-4" />,
  },
  { key: "files", label: "附件", icon: <Paperclip className="h-4 w-4" /> },
  { key: "history", label: "版本历史", icon: <History className="h-4 w-4" /> },
];

// 导出 CSV 工具函数
function exportExperimentCSV(exp: any) {
  const rows = [
    ["字段", "值"],
    ["标题", exp.title || ""],
    ["状态", statusLabel[exp.status] || exp.status],
    [
      "作者",
      exp.author ? `${exp.author.firstName} ${exp.author.lastName}` : "",
    ],
    [
      "创建时间",
      exp.createdAt ? new Date(exp.createdAt).toLocaleString("zh-CN") : "",
    ],
    [
      "更新时间",
      exp.updatedAt ? new Date(exp.updatedAt).toLocaleString("zh-CN") : "",
    ],
    ["任务数", exp._count?.tasks ?? 0],
    ["结果数", exp._count?.results ?? 0],
    ["文件数", exp._count?.files ?? 0],
  ];

  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `experiment-${exp.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────
// 子面板组件
// ────────────────────────────────────────────────

function TasksTab({ experimentId }: { experimentId: string }) {
  const { data: exp } = useQuery({
    queryKey: ["experiment", experimentId],
    queryFn: () => api.getExperiment(experimentId),
  });

  const tasks = exp?.tasks || [];

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ClipboardList className="mb-3 h-10 w-10" />
        <p className="text-sm">暂无关联任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task: any) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
        >
          <div>
            <p className="font-medium text-slate-900">{task.title}</p>
            {task.dueDate && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString("zh-CN")}
              </p>
            )}
          </div>
          <Badge label={task.status || "进行中"} status={task.status} />
        </div>
      ))}
    </div>
  );
}

function ResultsTab({ experimentId }: { experimentId: string }) {
  const { data: exp } = useQuery({
    queryKey: ["experiment", experimentId],
    queryFn: () => api.getExperiment(experimentId),
  });

  const results = exp?.results || [];

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <TestTube2 className="mb-3 h-10 w-10" />
        <p className="text-sm">暂无实验结果</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result: any) => (
        <div
          key={result.id}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <p className="font-medium text-slate-900">
            {result.name || result.title || "结果数据"}
          </p>
          {result.value && (
            <p className="mt-1 text-sm text-gray-600">
              值：<span className="font-mono">{result.value}</span>
              {result.unit && (
                <span className="ml-1 text-gray-400">{result.unit}</span>
              )}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {result.createdAt &&
              new Date(result.createdAt).toLocaleString("zh-CN")}
          </p>
        </div>
      ))}
    </div>
  );
}

function SamplesTab({ experimentId }: { experimentId: string }) {
  const { data: exp } = useQuery({
    queryKey: ["experiment", experimentId],
    queryFn: () => api.getExperiment(experimentId),
  });

  const samples = exp?.samples || [];

  if (samples.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FlaskConical className="mb-3 h-10 w-10" />
        <p className="text-sm">暂无关联样品</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {samples.map((sample: any) => (
        <div
          key={sample.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
        >
          <div>
            <p className="font-medium text-slate-900">{sample.name}</p>
            {sample.sampleType && (
              <p className="mt-0.5 text-xs text-gray-500">
                类型：{sample.sampleType}
              </p>
            )}
          </div>
          <Badge label={sample.status || "正常"} status={sample.status} />
        </div>
      ))}
    </div>
  );
}

function FilesTab({ experimentId }: { experimentId: string }) {
  const { data: exp } = useQuery({
    queryKey: ["experiment", experimentId],
    queryFn: () => api.getExperiment(experimentId),
  });

  const files = exp?.files || [];

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Paperclip className="mb-3 h-10 w-10" />
        <p className="text-sm">暂无附件</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file: any) => (
        <div
          key={file.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <Paperclip className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-slate-900">
                {file.name || file.filename}
              </p>
              {file.size && (
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>
          {file.url && (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              下载
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ experimentId }: { experimentId: string }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["experiment-history", experimentId],
    queryFn: () => api.getExperimentHistory(experimentId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <History className="mb-3 h-10 w-10" />
        <p className="text-sm">暂无版本历史</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((snapshot: any, index: number) => (
        <div
          key={snapshot.id}
          className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
              v{history.length - index}
            </div>
            {index < history.length - 1 && (
              <div className="mt-1 w-0.5 flex-1 bg-gray-200" />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              {snapshot.author && (
                <Avatar
                  firstName={snapshot.author?.firstName}
                  lastName={snapshot.author?.lastName}
                  userId={snapshot.author?.id}
                  size="sm"
                />
              )}
              <span className="text-sm font-medium text-slate-900">
                {snapshot.author
                  ? `${snapshot.author.firstName} ${snapshot.author.lastName}`
                  : "系统"}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(snapshot.createdAt).toLocaleString("zh-CN")}
              </span>
            </div>
            {snapshot.changeNote && (
              <p className="mt-1 text-sm text-gray-600">
                {snapshot.changeNote}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// 主页面
// ────────────────────────────────────────────────

export default function ExperimentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const experimentId = params.id;

  const [activeTab, setActiveTab] = useState<TabKey>("editor");
  const [editorContent, setEditorContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved",
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signPassword, setSignPassword] = useState("");
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  // 获取实验详情
  const { data: experiment, isLoading } = useQuery<any>({
    queryKey: ["experiment", experimentId],
    queryFn: () => api.getExperiment(experimentId),
  });

  // 初次加载时将后端 content 同步到编辑器状态
  useEffect(() => {
    if (experiment?.content && !editorContent) {
      setEditorContent(experiment.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiment?.content]);

  // 更新实验（标题 / 内容）
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateExperiment(experimentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiment", experimentId] });
      setSaveStatus("saved");
    },
    onError: () => {
      setSaveStatus("unsaved");
    },
  });

  // 签名（21 CFR Part 11：需密码确认）
  const signMutation = useMutation({
    mutationFn: (password: string) =>
      api.signExperiment(experimentId, password),
    onSuccess: () => {
      setSignError(null);
      setShowSignDialog(false);
      setSignPassword("");
      queryClient.invalidateQueries({ queryKey: ["experiment", experimentId] });
    },
    onError: (err: any) => {
      setSignError(err?.message || "签名失败，请重试");
    },
  });

  // 编辑器内容变化 → 触发自动保存
  const handleEditorChange = useCallback(
    (html: string) => {
      setEditorContent(html);
      setSaveStatus("saving");
      updateMutation.mutate({ content: html });
    },
    [updateMutation],
  );

  // 标题提交
  const handleTitleSubmit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== experiment?.title) {
      updateMutation.mutate({ title: trimmed });
    }
    setIsEditingTitle(false);
  };

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!experiment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <AlertCircle className="mb-3 h-12 w-12" />
        <p className="text-base">实验记录不存在或已删除</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          返回列表
        </button>
      </div>
    );
  }

  const isCompleted = experiment.status === "COMPLETED";
  const isSigned = experiment.status === "SIGNED";

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* 左侧：返回 + 标题 + 状态 */}
        <div className="flex flex-1 items-start gap-3">
          <button
            onClick={() => router.back()}
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            title="返回"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex-1">
            {isEditingTitle ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                className="w-full rounded-lg border border-blue-300 px-3 py-1.5 text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            ) : (
              <h1
                className="cursor-pointer text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors"
                onClick={() => {
                  setEditTitle(experiment.title || "");
                  setIsEditingTitle(true);
                }}
                title="点击编辑标题"
              >
                {experiment.title || "未命名实验"}
              </h1>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Badge
                label={statusLabel[experiment.status] || experiment.status}
                status={experiment.status}
              />
              {experiment.author && (
                <div className="flex items-center gap-1">
                  <Avatar
                    firstName={experiment.author.firstName}
                    lastName={experiment.author.lastName}
                    userId={experiment.author.id}
                    size="sm"
                  />
                  <span>
                    {experiment.author.firstName} {experiment.author.lastName}
                  </span>
                </div>
              )}
              <span>·</span>
              <span>
                更新于{" "}
                {new Date(experiment.updatedAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>
        </div>

        {/* 右侧：操作按钮组 */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {/* 签名按钮（仅 COMPLETED 状态显示，21 CFR Part 11 需密码确认） */}
          {isCompleted && !isSigned && (
            <button
              onClick={() => {
                setSignPassword("");
                setSignError(null);
                setShowSignDialog(true);
              }}
              disabled={signMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              签名
            </button>
          )}

          {/* 已签署标识 */}
          {isSigned && (
            <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700">
              <CheckCircle2 className="h-4 w-4" />
              已签署
            </div>
          )}

          {/* 提交审核按钮（Sprint 2 Agent B 添加接口后启用） */}
          <button
            disabled
            title="Sprint 2 中由 Agent B 实现提交审核接口"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-400 cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            提交审核
          </button>

          {/* 导出 CSV */}
          <button
            onClick={() => exportExperimentCSV(experiment)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            导出 CSV
          </button>

          {/* 版本历史下拉 */}
          <div className="relative" ref={historyDropdownRef}>
            <button
              onClick={() => setShowHistoryDropdown((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <History className="h-4 w-4" />
              版本历史
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showHistoryDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <button
                  onClick={() => {
                    setActiveTab("history");
                    setShowHistoryDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <History className="h-4 w-4" />
                  查看完整历史
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 签名错误提示 */}
      {signError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {signError}
        </div>
      )}

      {/* ── Tabbed Panel ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Tab 导航 */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-shrink-0 items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        <div className="p-4">
          {activeTab === "editor" && (
            <ELNEditor
              content={editorContent || experiment?.content || ""}
              onChange={handleEditorChange}
              saveStatus={saveStatus}
              readOnly={isSigned}
            />
          )}
          {activeTab === "tasks" && <TasksTab experimentId={experimentId} />}
          {activeTab === "results" && (
            <ResultsTab experimentId={experimentId} />
          )}
          {activeTab === "samples" && (
            <SamplesTab experimentId={experimentId} />
          )}
          {activeTab === "files" && <FilesTab experimentId={experimentId} />}
          {activeTab === "history" && (
            <HistoryTab experimentId={experimentId} />
          )}
        </div>
      </div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel experimentId={experimentId} />

      {/* 21 CFR Part 11 电子签名密码确认对话框 */}
      {showSignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              电子签名确认
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              根据 21 CFR Part 11
              合规要求，电子签名需要输入您的登录密码以验证身份。
            </p>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              登录密码
            </label>
            <input
              type="password"
              value={signPassword}
              onChange={(e) => setSignPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && signPassword) {
                  signMutation.mutate(signPassword);
                }
              }}
              placeholder="请输入您的密码"
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              autoFocus
            />
            {signError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {signError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSignDialog(false);
                  setSignPassword("");
                  setSignError(null);
                }}
                disabled={signMutation.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => signMutation.mutate(signPassword)}
                disabled={!signPassword || signMutation.isPending}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {signMutation.isPending ? "签名中…" : "确认签名"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
