"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, Bell, Check } from "lucide-react";
import { Avatar } from "@/components/Avatar";

const NOTIFICATION_TYPE_META: Record<string, { label: string; desc: string }> =
  {
    TASK_ASSIGNED: { label: "任务分配通知", desc: "当有任务分配给我时通知" },
    TASK_DUE: { label: "任务截止提醒", desc: "任务即将截止前提醒我" },
    BOOKING_CONFIRMED: { label: "仪器预约确认", desc: "预约成功或取消时通知" },
    TEAM_MESSAGE: { label: "团队消息通知", desc: "收到新留言或 @提及时通知" },
    LOW_STOCK: { label: "库存预警通知", desc: "库存低于警戒线时通知" },
    EXPERIMENT_STATUS: {
      label: "实验状态变更",
      desc: "实验状态发生变化时通知",
    },
    BOOKING_REMINDER: { label: "预约提醒", desc: "仪器预约开始前提醒" },
  };

function NotificationsSection() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => api.getNotificationPreferences(),
  });

  const updatePref = useMutation({
    mutationFn: ({
      type,
      data,
    }: {
      type: string;
      data: { email?: boolean; inApp?: boolean };
    }) => api.updateNotificationPreference(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">通知偏好</h2>

      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-0">
        <div className="flex-1" />
        <div className="flex items-center gap-6 text-xs text-gray-500 font-medium pr-1">
          <span className="w-12 text-center">邮件</span>
          <span className="w-12 text-center">应用内</span>
        </div>
      </div>

      <div className="space-y-1">
        {(preferences ?? []).map(
          (pref: { type: string; email: boolean; inApp: boolean }) => {
            const meta = NOTIFICATION_TYPE_META[pref.type];
            if (!meta) return null;
            return (
              <div
                key={pref.type}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    {meta.label}
                  </div>
                  <div className="text-xs text-gray-500">{meta.desc}</div>
                </div>
                <div className="flex items-center gap-6 pr-1">
                  {/* Email toggle */}
                  <div className="w-12 flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.email}
                        onChange={(e) =>
                          updatePref.mutate({
                            type: pref.type,
                            data: {
                              email: e.target.checked,
                              inApp: pref.inApp,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                  {/* InApp toggle */}
                  <div className="w-12 flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pref.inApp}
                        onChange={(e) =>
                          updatePref.mutate({
                            type: pref.type,
                            data: {
                              email: pref.email,
                              inApp: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>

      {updatePref.isSuccess && (
        <div className="mt-4 flex items-center gap-1 text-sm text-green-600">
          <Check className="h-4 w-4" /> 偏好已保存
        </div>
      )}
    </div>
  );
}

const profileSchema = z.object({
  firstName: z.string().min(1, "请输入名字"),
  lastName: z.string().min(1, "请输入姓氏"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z.string().min(6, "新密码至少 6 位"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<
    "profile" | "password" | "notifications"
  >("profile");

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const updatePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset();
    },
  });

  const sections = [
    { key: "profile" as const, label: "个人信息", icon: User },
    { key: "password" as const, label: "修改密码", icon: Lock },
    { key: "notifications" as const, label: "通知设置", icon: Bell },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">设置</h1>
        <p className="mt-1 text-sm text-gray-600">管理您的账户设置和偏好</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Nav */}
        <nav className="space-y-1">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeSection === key
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Section */}
          {activeSection === "profile" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                个人信息
              </h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  userId={user?.id}
                  size="lg"
                />
                <div>
                  <div className="font-medium text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {user?.role}
                  </div>
                </div>
              </div>

              <form
                onSubmit={profileForm.handleSubmit((data) =>
                  updateProfile.mutate(data),
                )}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名字
                    </label>
                    <input
                      {...profileForm.register("firstName")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="mt-1 text-xs text-red-600">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓氏
                    </label>
                    <input
                      {...profileForm.register("lastName")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="mt-1 text-xs text-red-600">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱
                  </label>
                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">邮箱地址无法修改</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateProfile.isPending ? "保存中..." : "保存更改"}
                  </button>
                  {updateProfile.isSuccess && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="h-4 w-4" /> 已保存
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Password Section */}
          {activeSection === "password" && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                修改密码
              </h2>

              <form
                onSubmit={passwordForm.handleSubmit((data) =>
                  updatePassword.mutate(data),
                )}
                className="space-y-4 max-w-md"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    当前密码
                  </label>
                  <input
                    {...passwordForm.register("currentPassword")}
                    type="password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="输入当前密码"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新密码
                  </label>
                  <input
                    {...passwordForm.register("newPassword")}
                    type="password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="至少 6 位"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    确认新密码
                  </label>
                  <input
                    {...passwordForm.register("confirmPassword")}
                    type="password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="再次输入新密码"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updatePassword.isPending}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatePassword.isPending ? "修改中..." : "修改密码"}
                  </button>
                  {updatePassword.isSuccess && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="h-4 w-4" /> 密码已更新
                    </span>
                  )}
                  {updatePassword.isError && (
                    <span className="text-sm text-red-600">
                      修改失败，请检查当前密码
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}
