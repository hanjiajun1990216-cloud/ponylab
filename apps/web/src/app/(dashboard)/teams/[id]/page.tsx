"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Mail,
  UserPlus,
  Check,
  X,
  Settings,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type Tab = "members" | "invitations" | "applications" | "settings";

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ teamId }: { teamId: string }) {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");

  const { data: members } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () => api.getTeamMembers(teamId),
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.createInvitation(teamId, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations", teamId] });
      setShowInvite(false);
      setEmail("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.removeTeamMember(teamId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members", teamId] }),
  });

  const roleLabel: Record<string, string> = {
    OWNER: "所有者",
    ADMIN: "管理员",
    MEMBER: "成员",
    VIEWER: "访客",
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          邀请成员
        </button>
      </div>

      <div className="space-y-2">
        {members?.map((member: any) => {
          const u = member.user || member;
          return (
            <div key={member.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 hover:bg-gray-50">
              <Avatar firstName={u.firstName} lastName={u.lastName} userId={u.id} />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">
                  {u.firstName} {u.lastName}
                </div>
                <div className="text-xs text-gray-500">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={roleLabel[member.role] || member.role || "成员"} variant="blue" />
                <div className="text-xs text-gray-400">
                  {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("zh-CN") : ""}
                </div>
                {member.role !== "OWNER" && (
                  <button
                    onClick={() => removeMutation.mutate(u.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="移除成员"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {(!members || members.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-8">暂无成员</p>
        )}
      </div>

      <Modal open={showInvite} onClose={() => { setShowInvite(false); setEmail(""); }} title="邀请成员">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="输入被邀请人的邮箱"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowInvite(false); setEmail(""); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={() => email && inviteMutation.mutate()}
              disabled={!email || inviteMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {inviteMutation.isPending ? "发送中..." : "发送邀请"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Invitations Tab ──────────────────────────────────────────────────────────

function InvitationsTab({ teamId }: { teamId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");

  const { data: invitations } = useQuery({
    queryKey: ["team-invitations", teamId],
    queryFn: () => api.getTeamInvitations(teamId),
  });

  const createInv = useMutation({
    mutationFn: () => api.createInvitation(teamId, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations", teamId] });
      setShowCreate(false);
      setEmail("");
    },
  });

  const statusLabel: Record<string, string> = {
    PENDING: "待处理",
    ACCEPTED: "已接受",
    DECLINED: "已拒绝",
    EXPIRED: "已过期",
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Mail className="h-4 w-4" />
          创建邀请
        </button>
      </div>

      <div className="space-y-2">
        {invitations?.map((inv: any) => (
          <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3">
            <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">{inv.email}</div>
              <div className="text-xs text-gray-500">
                发送于 {new Date(inv.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
            <Badge
              label={statusLabel[inv.status] || inv.status}
              status={inv.status}
            />
          </div>
        ))}
        {(!invitations || invitations.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-8">暂无待处理邀请</p>
        )}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setEmail(""); }} title="发送邀请">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="输入被邀请人邮箱"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowCreate(false); setEmail(""); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">取消</button>
            <button
              onClick={() => email && createInv.mutate()}
              disabled={!email || createInv.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createInv.isPending ? "发送中..." : "发送"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────

function ApplicationsTab({ teamId }: { teamId: string }) {
  const queryClient = useQueryClient();

  const { data: applications } = useQuery({
    queryKey: ["team-applications", teamId],
    queryFn: () => api.getTeamApplications(teamId),
  });

  const approve = useMutation({
    mutationFn: (appId: string) => api.approveApplication(teamId, appId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-applications", teamId] }),
  });

  const reject = useMutation({
    mutationFn: (appId: string) => api.rejectApplication(teamId, appId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-applications", teamId] }),
  });

  return (
    <div className="space-y-2">
      {applications?.map((app: any) => (
        <div key={app.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3">
          <Avatar firstName={app.user?.firstName} lastName={app.user?.lastName} userId={app.user?.id} />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">
              {app.user?.firstName} {app.user?.lastName}
            </div>
            <div className="text-xs text-gray-500">{app.user?.email}</div>
            {app.message && <div className="text-xs text-gray-600 mt-0.5 italic">"{app.message}"</div>}
          </div>
          {app.status === "PENDING" && (
            <div className="flex gap-2">
              <button
                onClick={() => approve.mutate(app.id)}
                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
              >
                <Check className="h-3 w-3" /> 批准
              </button>
              <button
                onClick={() => reject.mutate(app.id)}
                className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                <X className="h-3 w-3" /> 拒绝
              </button>
            </div>
          )}
          {app.status !== "PENDING" && (
            <Badge label={app.status === "APPROVED" ? "已批准" : "已拒绝"} status={app.status} />
          )}
        </div>
      ))}
      {(!applications || applications.length === 0) && (
        <p className="text-sm text-gray-400 text-center py-8">暂无申请</p>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ team }: { team: any }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      name: team?.name || "",
      description: team?.description || "",
      visibility: team?.visibility || "PRIVATE",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateTeam(team.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team", team.id] }),
  });

  return (
    <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">团队名称</label>
        <input
          {...register("name")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">可见性</label>
        <select
          {...register("visibility")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="PUBLIC">公开</option>
          <option value="PRIVATE">私密</option>
          <option value="INVITE_ONLY">仅邀请</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={updateMutation.isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {updateMutation.isPending ? "保存中..." : "保存更改"}
      </button>
      {updateMutation.isSuccess && (
        <p className="text-sm text-green-600">已保存</p>
      )}
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("members");

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: () => api.getTeam(id),
  });

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!team) return <div className="text-center py-12 text-gray-500">团队不存在</div>;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "members", label: "成员", icon: Users },
    { key: "invitations", label: "邀请", icon: Mail },
    { key: "applications", label: "申请", icon: UserPlus },
    { key: "settings", label: "设置", icon: Settings },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/teams" className="flex items-center gap-1 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          团队管理
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{team.name}</span>
      </div>

      {/* Team Header */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{team.name}</h1>
              <Badge label={team.visibility || "PRIVATE"} status={team.visibility || "PRIVATE"} />
            </div>
            {team.description && (
              <p className="text-sm text-gray-600">{team.description}</p>
            )}
            <div className="mt-2 text-xs text-gray-500">
              {team.members?.length || team._count?.members || 0} 位成员 · {team._count?.projects || 0} 个项目
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
      <div>
        {activeTab === "members" && <MembersTab teamId={id} />}
        {activeTab === "invitations" && <InvitationsTab teamId={id} />}
        {activeTab === "applications" && <ApplicationsTab teamId={id} />}
        {activeTab === "settings" && <SettingsTab team={team} />}
      </div>
    </div>
  );
}
