"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function SamplesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [newSample, setNewSample] = useState({ name: "", sampleType: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["samples", page, filter],
    queryFn: () =>
      api.getSamples(page, filter ? { sampleType: filter } : undefined),
  });

  const createMutation = useMutation({
    mutationFn: (sample: any) => api.createSample(sample),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      setShowCreate(false);
      setNewSample({ name: "", sampleType: "" });
    },
  });

  const statusIcons: Record<string, string> = {
    AVAILABLE: "🟢",
    IN_USE: "🔵",
    CONSUMED: "⚪",
    DISPOSED: "🔴",
    LOST: "❓",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Samples</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage your laboratory samples
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          + New Sample
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(newSample);
            }}
            className="flex gap-3"
          >
            <input
              value={newSample.name}
              onChange={(e) =>
                setNewSample({ ...newSample, name: e.target.value })
              }
              placeholder="Sample name..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              value={newSample.sampleType}
              onChange={(e) =>
                setNewSample({ ...newSample, sampleType: e.target.value })
              }
              placeholder="Type (e.g., DNA, Protein)"
              className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Storage</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map((sample: any) => (
                <tr key={sample.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link
                      href={`/samples/${sample.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {sample.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {sample.sampleType}
                  </td>
                  <td className="px-4 py-3">
                    <span>
                      {statusIcons[sample.status] || "⚪"} {sample.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {sample.barcode || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {sample.storage?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(sample.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No samples found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <span className="text-xs text-gray-500">
                {data.meta.total} samples total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded px-3 py-1 text-xs border disabled:opacity-50"
                >
                  Previous
                </button>
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
