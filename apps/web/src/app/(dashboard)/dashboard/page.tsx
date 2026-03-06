"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import Link from "next/link";
import {
  FlaskConical,
  AlertTriangle,
  Calendar,
  Bell,
  CheckSquare,
  ArrowRight,
  Microscope,
  Activity,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {isLoading ? (
        <div className="h-8 w-12 animate-pulse rounded bg-gray-200" />
      ) : (
        <div className="text-3xl font-bold text-slate-900">{value}</div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

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

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ["inventory-low-stock"],
    queryFn: () => api.getLowStockItems(),
  });

  const { data: instruments } = useQuery({
    queryKey: ["instruments-1"],
    queryFn: () => api.getInstruments(1),
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotifications(1),
  });

  const { data: notifCount } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => api.getUnreadNotificationCount(),
  });

  const { data: todayBookings, isLoading: todayBookingsLoading } = useQuery({
    queryKey: ["today-bookings"],
    queryFn: () => api.getTodayBookings(),
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-logs-dashboard"],
    queryFn: () => api.getAuditLogs(1),
  });

  // Compute stats
  const projectList = projects?.data || [];
  const lowStockItems = lowStockData || [];

  const activeProjects = projectList.filter(
    (p: any) => p.status === "ACTIVE" || p.status === "IN_PROGRESS",
  ).length;

  const availableInstruments =
    instruments?.data?.filter((i: any) => i.status === "AVAILABLE").length || 0;

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          你好，{user?.firstName}！
        </h1>
        <p className="mt-1 text-gray-500">这是您实验室今日概览。</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="进行中项目"
          value={activeProjects}
          icon={FlaskConical}
          color="bg-blue-500"
          isLoading={!projects}
        />
        <StatCard
          title="未读通知"
          value={notifCount?.count || 0}
          icon={Bell}
          color="bg-violet-500"
          isLoading={!notifCount}
        />
        <StatCard
          title="库存预警"
          value={lowStockItems.length}
          icon={AlertTriangle}
          color="bg-orange-500"
          isLoading={lowStockLoading}
        />
        <StatCard
          title="可用仪器"
          value={availableInstruments}
          icon={Microscope}
          color="bg-green-500"
          isLoading={!instruments}
        />
      </div>

      {/* 4 Quadrants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Left: Notifications */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-violet-500" />
              待办 & 提醒
            </h2>
            <Link
              href="/notifications"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              查看全部 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {!notifications ? (
            <LoadingSpinner size="sm" />
          ) : notifications.data?.length > 0 ? (
            <div className="space-y-2">
              {notifications.data.slice(0, 5).map((n: any) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-2 rounded-lg p-2 ${n.isRead ? "bg-white" : "bg-blue-50"}`}
                >
                  <div
                    className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.isRead ? "bg-gray-300" : "bg-blue-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 line-clamp-1">
                      {n.title || n.message || "新通知"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">暂无通知</p>
          )}
        </div>

        {/* Top Right: Project Progress */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-500" />
              我的实验进度
            </h2>
          </div>

          {!projects ? (
            <LoadingSpinner size="sm" />
          ) : projectList.length > 0 ? (
            <div className="space-y-3">
              {projectList.slice(0, 5).map((p: any) => {
                const total = p._count?.tasks || 0;
                const completed = p.completedTasks || 0;
                const progress =
                  total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="block group"
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-800 group-hover:text-blue-600 font-medium line-clamp-1">
                        {p.name}
                      </span>
                      <span className="text-gray-400 text-xs ml-2 flex-shrink-0">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">暂无项目</p>
          )}
        </div>

        {/* Bottom Left: Today's Instrument Bookings */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-500" />
              今日仪器预约
            </h2>
            <Link
              href="/instruments"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              查看全部 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {todayBookingsLoading ? (
            <LoadingSpinner size="sm" />
          ) : todayBookings && todayBookings.length > 0 ? (
            <div className="space-y-2">
              {todayBookings.slice(0, 5).map((booking: any) => (
                <Link
                  key={booking.id}
                  href={`/instruments/${booking.instrumentId}`}
                  className="flex items-start justify-between rounded-lg p-2 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Microscope className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 font-medium line-clamp-1">
                        {booking.instrument?.name}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {booking.user?.firstName} {booking.user?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(booking.startTime).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Badge label={booking.status} status={booking.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              今日暂无预约
            </p>
          )}
        </div>

        {/* Bottom Right: Low Stock Warning */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              库存预警
            </h2>
            <Link
              href="/inventory"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              查看库存 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {lowStockLoading ? (
            <LoadingSpinner size="sm" />
          ) : lowStockItems.length > 0 ? (
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-red-800">
                      {item.name}
                    </div>
                    <div className="text-xs text-red-600">
                      剩余 {item.quantity} {item.unit} / 最低 {item.minQuantity}{" "}
                      {item.unit}
                    </div>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-3">
              <CheckSquare className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">所有库存充足</span>
            </div>
          )}

          {/* Recent Team Activity */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs font-semibold uppercase text-gray-400 mb-2">
              <Activity className="h-3 w-3" />
              近期团队动态
            </div>
            {auditLoading ? (
              <LoadingSpinner size="sm" />
            ) : auditLogs?.data && auditLogs.data.length > 0 ? (
              <div className="space-y-1.5">
                {auditLogs.data.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 line-clamp-1">
                        <span className="font-medium">{log.action}</span>{" "}
                        {log.entityType}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">暂无动态</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
