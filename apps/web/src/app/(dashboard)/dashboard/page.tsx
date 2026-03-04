"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.getTeams(),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-gray-600">
          Here&apos;s an overview of your lab activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Experiments" value="—" icon="🧪" />
        <StatCard title="Samples Tracked" value="—" icon="🧬" />
        <StatCard title="Low Stock Items" value="—" icon="⚠️" />
        <StatCard title="Upcoming Bookings" value="—" icon="📅" />
      </div>

      {/* Teams */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Teams</h2>
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team: any) => (
              <div
                key={team.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {team.description || "No description"}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>{team.members?.length || 0} members</span>
                  <span>{team._count?.projects || 0} projects</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-gray-500">
              No teams yet. Create your first team to get started.
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Activity
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Activity feed will appear here as you use the system.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
