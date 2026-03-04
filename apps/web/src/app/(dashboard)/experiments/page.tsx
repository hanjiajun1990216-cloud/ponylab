"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function ExperimentsPage() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

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

  const projectId = selectedProject || projects?.data?.[0]?.id;

  const { data: experiments, isLoading } = useQuery({
    queryKey: ["experiments", projectId],
    queryFn: () => api.getExperimentsByProject(projectId!),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      api.createExperiment({ title, projectId: projectId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      setShowCreate(false);
      setNewTitle("");
    },
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    SIGNED: "bg-purple-100 text-purple-700",
    ARCHIVED: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Experiments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your lab experiments and records
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          disabled={!projectId}
        >
          + New Experiment
        </button>
      </div>

      {/* Project Filter */}
      {projects?.data && projects.data.length > 0 && (
        <div className="mb-4 flex gap-2">
          {projects.data.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                projectId === p.id
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(newTitle);
            }}
            className="flex gap-3"
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Experiment title..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || createMutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Experiments List */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : experiments?.data?.length > 0 ? (
        <div className="space-y-3">
          {experiments.data.map((exp: any) => (
            <div
              key={exp.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    by {exp.author?.firstName} {exp.author?.lastName} ·{" "}
                    {new Date(exp.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[exp.status] || "bg-gray-100"
                  }`}
                >
                  {exp.status}
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>{exp._count?.tasks || 0} tasks</span>
                <span>{exp._count?.results || 0} results</span>
                <span>{exp._count?.files || 0} files</span>
              </div>
              {exp.tags?.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {exp.tags.map((t: any) => (
                    <span
                      key={t.id}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {t.tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-gray-500">
            No experiments yet. Create your first experiment to get started.
          </p>
        </div>
      )}
    </div>
  );
}
