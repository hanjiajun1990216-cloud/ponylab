"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ProtocolsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["protocols", page],
    queryFn: () => api.getProtocols(page),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Protocols & SOPs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Standardized operating procedures with version control
          </p>
        </div>
        <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          + New Protocol
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : data?.data?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((protocol: any) => (
            <div
              key={protocol.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{protocol.name}</h3>
                {protocol.isPublished ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Published
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    Draft
                  </span>
                )}
              </div>
              {protocol.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {protocol.description}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {protocol.author?.firstName} {protocol.author?.lastName}
                </span>
                <span>v{protocol._count?.versions || 1}</span>
              </div>
              {protocol.category && (
                <div className="mt-2">
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {protocol.category}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">
            No protocols yet. Create your first SOP to standardize procedures.
          </p>
        </div>
      )}
    </div>
  );
}
