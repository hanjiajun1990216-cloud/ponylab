"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  BarChart3,
  Wrench,
  Pin,
  Tag,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Calendar library
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Event,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { zhCN } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { "zh-CN": zhCN },
});

// User colors (deterministic)
const USER_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++)
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

type Tab = "calendar" | "comments" | "maintenance" | "stats";

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab({ instrumentId }: { instrumentId: string }) {
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [purpose, setPurpose] = useState("");
  const queryClient = useQueryClient();

  const now = new Date();
  const startStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endStr = new Date(
    now.getFullYear(),
    now.getMonth() + 2,
    0,
  ).toISOString();

  const { data: bookings } = useQuery({
    queryKey: ["instrument-bookings", instrumentId],
    queryFn: () => api.getInstrumentCalendar(instrumentId, startStr, endStr),
  });

  const createBooking = useMutation({
    mutationFn: (data: { startTime: string; endTime: string; title: string }) =>
      api.createBooking({ instrumentId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["instrument-bookings", instrumentId],
      });
      setShowBookModal(false);
      setPurpose("");
    },
  });

  const events: Event[] = (bookings || []).map((b: any) => ({
    id: b.id,
    title: `${b.user?.firstName || "用户"} ${b.user?.lastName || ""}${b.purpose ? ` — ${b.purpose}` : ""}`,
    start: new Date(b.startTime),
    end: new Date(b.endTime),
    resource: b,
  }));

  const eventStyleGetter = useCallback((event: any) => {
    const userId = event.resource?.user?.id || "default";
    const color = getUserColor(userId);
    return {
      style: {
        backgroundColor: color,
        borderRadius: "4px",
        border: "none",
        color: "#fff",
        fontSize: "12px",
      },
    };
  }, []);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setSelectedSlot({ start, end });
      setShowBookModal(true);
    },
    [],
  );

  return (
    <div>
      <div className="mb-3 text-sm text-gray-500">
        点击空白时间段可以快速预约
      </div>
      <div style={{ height: 500 }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          defaultView="week"
          views={["week", "month", "day"]}
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          culture="zh-CN"
          messages={{
            today: "今天",
            previous: "上一页",
            next: "下一页",
            week: "周",
            month: "月",
            day: "日",
            showMore: (total) => `还有 ${total} 个`,
          }}
        />
      </div>

      <Modal
        open={showBookModal}
        onClose={() => {
          setShowBookModal(false);
          setPurpose("");
        }}
        title="预约仪器"
      >
        <div className="space-y-4">
          {selectedSlot && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <div>开始: {selectedSlot.start.toLocaleString("zh-CN")}</div>
              <div>结束: {selectedSlot.end.toLocaleString("zh-CN")}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              使用目的（可选）
            </label>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="描述使用目的..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowBookModal(false);
                setPurpose("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (selectedSlot) {
                  createBooking.mutate({
                    startTime: selectedSlot.start.toISOString(),
                    endTime: selectedSlot.end.toISOString(),
                    title: purpose || "预约使用",
                  });
                }
              }}
              disabled={createBooking.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createBooking.isPending ? "预约中..." : "确认预约"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Comments Tab ─────────────────────────────────────────────────────────────

function CommentsTab({ instrumentId }: { instrumentId: string }) {
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("GENERAL");
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ["comments-instrument", instrumentId],
    queryFn: () => api.getCommentsByInstrument(instrumentId),
  });

  const addComment = useMutation({
    mutationFn: () => api.createComment({ content, instrumentId, tags: [tag] }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments-instrument", instrumentId],
      });
      setContent("");
    },
  });

  const tagColors: Record<string, string> = {
    QUESTION: "bg-blue-100 text-blue-700",
    SUGGESTION: "bg-green-100 text-green-700",
    MAINTENANCE: "bg-yellow-100 text-yellow-700",
    GENERAL: "bg-gray-100 text-gray-700",
  };

  const pinnedComments = comments?.filter((c: any) => c.isPinned) || [];
  const regularComments = comments?.filter((c: any) => !c.isPinned) || [];

  return (
    <div className="space-y-4">
      {/* Pinned */}
      {pinnedComments.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase text-gray-500 mb-2 flex items-center gap-1">
            <Pin className="h-3 w-3" /> 置顶消息
          </div>
          <div className="space-y-2">
            {pinnedComments.map((c: any) => (
              <CommentCard key={c.id} comment={c} tagColors={tagColors} />
            ))}
          </div>
        </div>
      )}

      {/* Regular */}
      <div className="space-y-2">
        {regularComments.map((c: any) => (
          <CommentCard key={c.id} comment={c} tagColors={tagColors} />
        ))}
        {(!comments || comments.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-8">暂无留言</p>
        )}
      </div>

      {/* Input */}
      <div className="rounded-lg border border-gray-200 p-3 space-y-2">
        <div className="flex gap-2">
          {["GENERAL", "QUESTION", "SUGGESTION", "MAINTENANCE"].map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                tag === t
                  ? tagColors[t]
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t === "GENERAL"
                ? "通用"
                : t === "QUESTION"
                  ? "问题"
                  : t === "SUGGESTION"
                    ? "建议"
                    : "维护"}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="发表留言..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={() => content.trim() && addComment.mutate()}
            disabled={!content.trim() || addComment.isPending}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {addComment.isPending ? "发送中..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  tagColors,
}: {
  comment: any;
  tagColors: Record<string, string>;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3">
      <div className="flex items-start gap-2">
        <Avatar
          firstName={comment.author?.firstName}
          lastName={comment.author?.lastName}
          userId={comment.author?.id}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800">
              {comment.author?.firstName} {comment.author?.lastName}
            </span>
            {comment.tags?.map((t: string) => (
              <span
                key={t}
                className={`rounded-full px-1.5 py-0.5 text-xs ${tagColors[t] || tagColors.GENERAL}`}
              >
                <Tag className="h-2.5 w-2.5 inline mr-0.5" />
                {t}
              </span>
            ))}
            {comment.isPinned && <Pin className="h-3 w-3 text-orange-500" />}
          </div>
          <p className="text-sm text-gray-700">{comment.content}</p>
          <div className="mt-1 text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleString("zh-CN")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Maintenance Tab ──────────────────────────────────────────────────────────

const MAINTENANCE_TYPE_COLORS: Record<string, string> = {
  CALIBRATION: "bg-blue-100 text-blue-700",
  PREVENTIVE: "bg-green-100 text-green-700",
  REPAIR: "bg-red-100 text-red-700",
  CLEANING: "bg-yellow-100 text-yellow-700",
};

const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  CALIBRATION: "校准",
  PREVENTIVE: "预防性维护",
  REPAIR: "维修",
  CLEANING: "清洁",
};

function MaintenanceTab({
  instrumentId,
  maintenance,
}: {
  instrumentId: string;
  maintenance: any[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: "CALIBRATION",
    description: "",
    performedAt: new Date().toISOString().split("T")[0],
    nextDueDate: "",
    cost: "",
  });
  const queryClient = useQueryClient();

  const addMaintenance = useMutation({
    mutationFn: () =>
      api.addMaintenanceRecord(instrumentId, {
        type: form.type,
        description: form.description,
        performedAt: form.performedAt,
        nextDueDate: form.nextDueDate || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instrument", instrumentId] });
      setShowModal(false);
      setForm({
        type: "CALIBRATION",
        description: "",
        performedAt: new Date().toISOString().split("T")[0],
        nextDueDate: "",
        cost: "",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">维护记录</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          添加记录
        </button>
      </div>

      {maintenance.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <Wrench className="mx-auto mb-2 h-10 w-10 opacity-40" />
          <p>暂无维护记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {maintenance.map((record: any) => (
            <div
              key={record.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${MAINTENANCE_TYPE_COLORS[record.type] || "bg-gray-100 text-gray-700"}`}
                  >
                    {MAINTENANCE_TYPE_LABELS[record.type] || record.type}
                  </span>
                  {record.cost != null && (
                    <span className="text-xs text-gray-500">
                      ¥{record.cost.toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(record.performedAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{record.description}</p>
              {record.nextDueDate && (
                <p className="mt-1 text-xs text-orange-600">
                  下次维护:{" "}
                  {new Date(record.nextDueDate).toLocaleDateString("zh-CN")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="添加维护记录"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              维护类型
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="CALIBRATION">校准</option>
              <option value="PREVENTIVE">预防性维护</option>
              <option value="REPAIR">维修</option>
              <option value="CLEANING">清洁</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="描述维护内容..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                执行日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.performedAt}
                onChange={(e) =>
                  setForm({ ...form, performedAt: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                下次维护日期（可选）
              </label>
              <input
                type="date"
                value={form.nextDueDate}
                onChange={(e) =>
                  setForm({ ...form, nextDueDate: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              费用（可选，元）
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={() => addMaintenance.mutate()}
              disabled={
                !form.description.trim() ||
                !form.performedAt ||
                addMaintenance.isPending
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addMaintenance.isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Stats Tab ─────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function StatsTab({ instrumentId }: { instrumentId: string }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["instrument-stats", instrumentId],
    queryFn: () => api.getInstrumentStats(instrumentId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return <div className="py-12 text-center text-gray-400">暂无统计数据</div>;
  }

  const uniqueUsers = stats.userUsage?.length || 0;
  const avgDaily =
    stats.totalBookings > 0 ? (stats.totalBookings / 30).toFixed(1) : "0.0";

  const dailyData = (stats.dailyCounts || []).map((d: any) => ({
    date: d.date.slice(5), // "MM-DD"
    count: d.count,
  }));

  const pieData = (stats.userUsage || []).map((u: any) => ({
    name: u.name,
    value: Math.round(u.hours * 10) / 10,
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalBookings}
          </div>
          <div className="mt-1 text-xs text-blue-700">近30天预约次数</div>
        </div>
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.totalHours}h
          </div>
          <div className="mt-1 text-xs text-green-700">近30天使用小时</div>
        </div>
        <div className="rounded-lg bg-purple-50 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {uniqueUsers}
          </div>
          <div className="mt-1 text-xs text-purple-700">使用用户数</div>
        </div>
        <div className="rounded-lg bg-orange-50 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{avgDaily}</div>
          <div className="mt-1 text-xs text-orange-700">日均预约次数</div>
        </div>
      </div>

      {/* Bar Chart: Daily Bookings */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-700">
          近30天每日预约量
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={dailyData}
            margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval={4}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: any) => [`${value} 次`, "预约次数"]}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart: User Usage */}
      {pieData.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700">
            用户使用时长分布
          </h4>
          <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((_: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value}h`, "使用时长"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Usage Table */}
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    用户
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">
                    预约次数
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">
                    使用时长
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.userUsage.map((u: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="flex items-center gap-2 px-4 py-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      {u.name}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {u.count}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {(Math.round(u.hours * 10) / 10).toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pieData.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          近30天暂无使用数据
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstrumentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  const { data: instrument, isLoading } = useQuery({
    queryKey: ["instrument", id],
    queryFn: () => api.getInstrument(id),
  });

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!instrument)
    return <div className="text-center py-12 text-gray-500">仪器不存在</div>;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "calendar", label: "预约日历", icon: Calendar },
    { key: "comments", label: "留言板", icon: MessageSquare },
    { key: "maintenance", label: "维护记录", icon: Wrench },
    { key: "stats", label: "使用统计", icon: BarChart3 },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/instruments"
          className="flex items-center gap-1 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          仪器
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{instrument.name}</span>
      </div>

      {/* Instrument Header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">
                {instrument.name}
              </h1>
              <Badge label={instrument.status} status={instrument.status} />
            </div>
            <p className="text-sm text-gray-500">
              {instrument.manufacturer && `${instrument.manufacturer} `}
              {instrument.model && `· ${instrument.model}`}
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              {instrument.serialNumber && (
                <span>S/N: {instrument.serialNumber}</span>
              )}
              {instrument.location && <span>位置: {instrument.location}</span>}
              <span>{instrument._count?.bookings || 0} 次预约</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-gray-200">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {activeTab === "calendar" && <CalendarTab instrumentId={id} />}
        {activeTab === "comments" && <CommentsTab instrumentId={id} />}
        {activeTab === "maintenance" && (
          <MaintenanceTab
            instrumentId={id}
            maintenance={instrument.maintenance || []}
          />
        )}
        {activeTab === "stats" && <StatsTab instrumentId={id} />}
      </div>
    </div>
  );
}
