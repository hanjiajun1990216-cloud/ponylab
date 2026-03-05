"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["audit", page, filters],
    queryFn: () => api.getAuditLogs(page, filters),
  });

  const actionIcons: Record<string, string> = {
    CREATE: "🟢",
    UPDATE: "🔵",
    DELETE: "🔴",
    SIGN: "✍️",
    LOGIN: "🔑",
    REGISTER: "👤",
    INVENTORY_ADJUST: "📦",
    EXPORT: "📤",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-600">
          Complete audit trail of all system activities (read-only, immutable)
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {log.user?.firstName} {log.user?.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      {actionIcons[log.action] || "⚪"} {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.entityType}
                    <span className="ml-1 text-xs text-gray-400 font-mono">
                      {log.entityId?.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                    {log.newValue
                      ? JSON.stringify(log.newValue).slice(0, 80)
                      : "—"}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-gray-500">
                {data.meta.total} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded px-3 py-1 text-xs border disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-2 py-1 text-xs text-gray-500">
                  Page {page} of {data.meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.meta.totalPages}
                  className="rounded px-3 py-1 text-xs border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
