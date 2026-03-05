"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Plus, Eye, Calendar, Microscope } from "lucide-react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function InstrumentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["instruments", page],
    queryFn: () => api.getInstruments(page),
  });

  const instruments = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (data?.limit || 20));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">仪器管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理实验室仪器、预约和维护记录
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          注册仪器
        </button>
      </div>

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
                {inst.serialNumber && <div>序列号: {inst.serialNumber}</div>}
                {inst.location && <div>位置: {inst.location}</div>}
                <div>{inst._count?.bookings || 0} 次预约记录</div>
              </div>

              {/* Next booking info */}
              {inst.nextBooking && (
                <div className="mb-3 rounded-lg bg-blue-50 px-2 py-1.5 text-xs text-blue-700">
                  下次预约:{" "}
                  {new Date(inst.nextBooking.startTime).toLocaleString("zh-CN")}
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
    </div>
  );
}
