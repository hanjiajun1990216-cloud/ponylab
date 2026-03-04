"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function InstrumentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["instruments", page],
    queryFn: () => api.getInstruments(page),
  });

  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700",
    IN_USE: "bg-blue-100 text-blue-700",
    MAINTENANCE: "bg-yellow-100 text-yellow-700",
    OUT_OF_ORDER: "bg-red-100 text-red-700",
    RETIRED: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instruments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage lab instruments, bookings, and maintenance
          </p>
        </div>
        <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          + Register Instrument
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : data?.data?.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((inst: any) => (
            <div
              key={inst.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{inst.name}</h3>
                  <p className="text-xs text-gray-500">
                    {inst.manufacturer} {inst.model}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusColors[inst.status] || "bg-gray-100"
                  }`}
                >
                  {inst.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                {inst.serialNumber && <div>S/N: {inst.serialNumber}</div>}
                {inst.location && <div>Location: {inst.location}</div>}
                <div>{inst._count?.bookings || 0} bookings</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="text-4xl mb-3">🔬</div>
          <p className="text-gray-500">
            No instruments registered yet.
          </p>
        </div>
      )}
    </div>
  );
}
