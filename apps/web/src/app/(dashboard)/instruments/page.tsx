"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Plus,
  Eye,
  Calendar,
  Microscope,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfDay,
  endOfDay,
  addDays,
} from "date-fns";
import { zhCN } from "date-fns/locale/zh-CN";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { "zh-CN": zhCN },
});

const USER_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

function getEventColor(userId: string, userColor?: string): string {
  if (userColor) return userColor;
  // deterministic color from userId hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

type ViewMode = "list" | "timeline";

export default function InstrumentsPage() {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [calendarDate, setCalendarDate] = useState(new Date());

  const { data, isLoading } = useQuery({
    queryKey: ["instruments", page],
    queryFn: () => api.getInstruments(page),
  });

  // For timeline: fetch all instruments (page 1, limit 100 is plenty for a lab)
  const { data: allInstrumentsData } = useQuery({
    queryKey: ["instruments-all"],
    queryFn: () => api.getInstruments(1),
    enabled: viewMode === "timeline",
  });

  // Compute timeline date range: one week around calendarDate
  const timelineStart = useMemo(
    () => startOfDay(calendarDate).toISOString(),
    [calendarDate],
  );
  const timelineEnd = useMemo(
    () => endOfDay(addDays(calendarDate, 6)).toISOString(),
    [calendarDate],
  );

  const { data: allBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["all-instrument-bookings", timelineStart, timelineEnd],
    queryFn: () => api.getAllInstrumentBookings(timelineStart, timelineEnd),
    enabled: viewMode === "timeline",
  });

  const instruments = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (data?.limit || 20));

  // Build resources & events for BigCalendar resource view
  const resources = useMemo(() => {
    const list = allInstrumentsData?.data || [];
    return list.map((inst: any) => ({
      resourceId: inst.id,
      resourceTitle: inst.name,
    }));
  }, [allInstrumentsData]);

  const calendarEvents = useMemo(() => {
    if (!allBookings) return [];
    return allBookings.map((b: any) => ({
      id: b.id,
      title:
        `${b.title || "预约"} — ${b.user?.firstName ?? ""} ${b.user?.lastName ?? ""}`.trim(),
      start: new Date(b.startTime),
      end: new Date(b.endTime),
      resourceId: b.instrumentId,
      color: getEventColor(b.user?.id ?? b.instrumentId, b.user?.userColor),
      booking: b,
    }));
  }, [allBookings]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">仪器管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理实验室仪器、预约和维护记录
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              列表视图
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "timeline"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              时间线视图
            </button>
          </div>

          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            注册仪器
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          {isLoading ? (
            <LoadingSpinner fullPage />
          ) : instruments.length === 0 ? (
            <EmptyState
              icon={Microscope}
              title="暂无仪器"
              description="注册第一台仪器，开始管理预约"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {instruments.map((inst: any) => (
                <div
                  key={inst.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Microscope className="h-5 w-5" />
                    </div>
                    <Badge label={inst.status} status={inst.status} />
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-0.5">
                    {inst.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {inst.manufacturer && `${inst.manufacturer}`}
                    {inst.model && ` · ${inst.model}`}
                  </p>

                  <div className="space-y-1 text-xs text-gray-500 mb-4">
                    {inst.serialNumber && (
                      <div>序列号: {inst.serialNumber}</div>
                    )}
                    {inst.location && <div>位置: {inst.location}</div>}
                    <div>{inst._count?.bookings || 0} 次预约记录</div>
                  </div>

                  {/* Next booking info */}
                  {inst.nextBooking && (
                    <div className="mb-3 rounded-lg bg-blue-50 px-2 py-1.5 text-xs text-blue-700">
                      下次预约:{" "}
                      {new Date(inst.nextBooking.startTime).toLocaleString(
                        "zh-CN",
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/instruments/${inst.id}`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      查看详情
                    </Link>
                    <Link
                      href={`/instruments/${inst.id}?tab=calendar`}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        inst.status === "AVAILABLE"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border border-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      预约
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        /* Timeline View */
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
            <Microscope className="h-4 w-4 text-teal-500" />
            <span>
              纵轴 = 仪器，横轴 = 时间，事件 = 各仪器预约（按用户着色）
            </span>
          </div>

          {bookingsLoading ? (
            <LoadingSpinner fullPage />
          ) : (
            <div style={{ height: 600 }}>
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                resources={resources}
                resourceIdAccessor="resourceId"
                resourceTitleAccessor="resourceTitle"
                defaultView="week"
                views={["day", "week"]}
                date={calendarDate}
                onNavigate={(date: Date) => setCalendarDate(date)}
                culture="zh-CN"
                eventPropGetter={(event: any) => ({
                  style: {
                    backgroundColor: event.color,
                    borderColor: event.color,
                    color: "#fff",
                    borderRadius: "4px",
                    fontSize: "12px",
                  },
                })}
                messages={{
                  week: "周",
                  day: "日",
                  today: "今天",
                  previous: "上一周",
                  next: "下一周",
                  noEventsInRange: "该时段暂无预约",
                }}
                tooltipAccessor={(event: any) =>
                  `${event.booking?.instrument?.name ?? ""}\n${event.title}\n${new Date(event.start).toLocaleTimeString("zh-CN")} - ${new Date(event.end).toLocaleTimeString("zh-CN")}`
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
