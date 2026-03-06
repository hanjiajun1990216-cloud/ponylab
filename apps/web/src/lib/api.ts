const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("ponylab_token", token);
    } else {
      localStorage.removeItem("ponylab_token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("ponylab_token");
    }
    return this.token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API Error: ${res.status}`);
    }

    return res.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.fetch<{ accessToken: string; refreshToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );
  }

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.fetch<{ accessToken: string; refreshToken: string }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) {
    return this.fetch<any>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  updatePassword(data: { currentPassword: string; newPassword: string }) {
    return this.fetch<any>("/users/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Users
  getProfile() {
    return this.fetch<any>("/users/me");
  }

  // Teams
  getTeams() {
    return this.fetch<any[]>("/teams");
  }

  getTeam(id: string) {
    return this.fetch<any>(`/teams/${id}`);
  }

  createTeam(data: {
    name: string;
    description?: string;
    visibility?: string;
  }) {
    return this.fetch<any>("/teams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateTeam(
    id: string,
    data: { name?: string; description?: string; visibility?: string },
  ) {
    return this.fetch<any>(`/teams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  getTeamMembers(teamId: string) {
    return this.fetch<any[]>(`/teams/${teamId}/members`);
  }

  removeTeamMember(teamId: string, userId: string) {
    return this.fetch<any>(`/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  // Team Invitations
  getTeamInvitations(teamId: string) {
    return this.fetch<any[]>(`/teams/${teamId}/invitations`);
  }

  createInvitation(teamId: string, data: { email: string; role?: string }) {
    return this.fetch<any>(`/teams/${teamId}/invitations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Team Applications
  getTeamApplications(teamId: string) {
    return this.fetch<any[]>(`/teams/${teamId}/applications`);
  }

  approveApplication(teamId: string, applicationId: string) {
    return this.fetch<any>(
      `/teams/${teamId}/applications/${applicationId}/approve`,
      { method: "POST" },
    );
  }

  rejectApplication(teamId: string, applicationId: string) {
    return this.fetch<any>(
      `/teams/${teamId}/applications/${applicationId}/reject`,
      { method: "POST" },
    );
  }

  // Directions
  getDirections(teamId?: string) {
    const params = teamId ? `?teamId=${teamId}` : "";
    return this.fetch<any[]>(`/directions${params}`);
  }

  getDirection(id: string) {
    return this.fetch<any>(`/directions/${id}`);
  }

  createDirection(data: {
    name: string;
    description?: string;
    teamId: string;
    leaderId?: string;
  }) {
    return this.fetch<any>("/directions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateDirection(id: string, data: any) {
    return this.fetch<any>(`/directions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteDirection(id: string) {
    return this.fetch<any>(`/directions/${id}`, { method: "DELETE" });
  }

  // Projects
  getProjectsByTeam(teamId: string, page = 1) {
    return this.fetch<any>(`/projects/team/${teamId}?page=${page}`);
  }

  getProjectsByDirection(directionId: string) {
    return this.fetch<any[]>(`/projects/direction/${directionId}`);
  }

  getProject(id: string) {
    return this.fetch<any>(`/projects/${id}`);
  }

  getProjectWithTasks(id: string) {
    return this.fetch<any>(`/projects/${id}/tasks`);
  }

  createProject(data: {
    name: string;
    description?: string;
    teamId: string;
    directionId?: string;
  }) {
    return this.fetch<any>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateProject(id: string, data: any) {
    return this.fetch<any>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Tasks
  getTask(id: string) {
    return this.fetch<any>(`/tasks/${id}`);
  }

  getTasksByProject(projectId: string) {
    return this.fetch<any[]>(`/tasks/project/${projectId}`);
  }

  createTask(data: {
    name: string;
    projectId: string;
    description?: string;
    dueDate?: string;
    assigneeId?: string;
  }) {
    return this.fetch<any>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateTask(id: string, data: any) {
    return this.fetch<any>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  updateTaskPosition(id: string, data: { x: number; y: number }) {
    return this.fetch<any>(`/tasks/${id}/position`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Task Steps
  getTaskSteps(taskId: string) {
    return this.fetch<any[]>(`/tasks/${taskId}/steps`);
  }

  createTaskStep(taskId: string, data: { name: string; order?: number }) {
    return this.fetch<any>(`/tasks/${taskId}/steps`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateTaskStep(
    taskId: string,
    stepId: string,
    data: { completed?: boolean; name?: string },
  ) {
    return this.fetch<any>(`/tasks/${taskId}/steps/${stepId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteTaskStep(taskId: string, stepId: string) {
    return this.fetch<any>(`/tasks/${taskId}/steps/${stepId}`, {
      method: "DELETE",
    });
  }

  // Comments
  getCommentsByProject(projectId: string) {
    return this.fetch<any[]>(`/comments/project/${projectId}`);
  }

  getCommentsByTask(taskId: string) {
    return this.fetch<any[]>(`/comments/task/${taskId}`);
  }

  getCommentsByInstrument(instrumentId: string) {
    return this.fetch<any[]>(`/comments/instrument/${instrumentId}`);
  }

  createComment(data: {
    content: string;
    projectId?: string;
    taskId?: string;
    instrumentId?: string;
    isPinned?: boolean;
    tags?: string[];
  }) {
    return this.fetch<any>("/comments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateComment(id: string, data: { content?: string; isPinned?: boolean }) {
    return this.fetch<any>(`/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteComment(id: string) {
    return this.fetch<any>(`/comments/${id}`, { method: "DELETE" });
  }

  // Experiments
  getExperimentsByProject(projectId: string, page = 1) {
    return this.fetch<any>(`/experiments/project/${projectId}?page=${page}`);
  }

  getExperiment(id: string) {
    return this.fetch<any>(`/experiments/${id}`);
  }

  createExperiment(data: { title: string; projectId: string }) {
    return this.fetch<any>("/experiments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateExperiment(id: string, data: any) {
    return this.fetch<any>(`/experiments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  signExperiment(id: string) {
    return this.fetch<any>(`/experiments/${id}/sign`, { method: "POST" });
  }

  getExperimentHistory(id: string) {
    return this.fetch<any[]>(`/experiments/${id}/history`);
  }

  // Samples
  getSamples(page = 1, filters?: { sampleType?: string; status?: string }) {
    const params = new URLSearchParams({ page: String(page) });
    if (filters?.sampleType) params.set("sampleType", filters.sampleType);
    if (filters?.status) params.set("status", filters.status);
    return this.fetch<any>(`/samples?${params}`);
  }

  createSample(data: any) {
    return this.fetch<any>("/samples", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getSample(id: string) {
    return this.fetch<any>(`/samples/${id}`);
  }

  addSampleEvent(id: string, data: { type: string; note?: string }) {
    return this.fetch<any>(`/samples/${id}/events`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateSampleStatus(id: string, status: string) {
    return this.fetch<any>(`/samples/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // Inventory
  getInventory(page = 1, category?: string) {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set("category", category);
    return this.fetch<any>(`/inventory?${params}`);
  }

  getLowStockItems() {
    return this.fetch<any[]>("/inventory/low-stock");
  }

  adjustInventory(
    id: string,
    data: { action: string; amount: number; reason?: string },
  ) {
    return this.fetch<any>(`/inventory/${id}/adjust`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Protocols
  getProtocols(page = 1, category?: string) {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set("category", category);
    return this.fetch<any>(`/protocols?${params}`);
  }

  // Instruments
  getInstruments(page = 1) {
    return this.fetch<any>(`/instruments?page=${page}`);
  }

  getTodayBookings() {
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).toISOString();
    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    ).toISOString();
    return this.fetch<any[]>(
      `/instruments/bookings/today?start=${start}&end=${end}`,
    );
  }

  getInstrument(id: string) {
    return this.fetch<any>(`/instruments/${id}`);
  }

  getInstrumentCalendar(id: string, start: string, end: string) {
    return this.fetch<any[]>(
      `/instruments/${id}/bookings?start=${start}&end=${end}`,
    );
  }

  getInstrumentStats(id: string) {
    return this.fetch<any>(`/instruments/${id}/stats`);
  }

  checkInstrumentAvailability(id: string, start: string, end: string) {
    return this.fetch<{ available: boolean }>(
      `/instruments/${id}/availability?start=${start}&end=${end}`,
    );
  }

  createBooking(data: {
    instrumentId: string;
    startTime: string;
    endTime: string;
    title: string;
  }) {
    return this.fetch<any>("/instruments/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  cancelBooking(bookingId: string) {
    return this.fetch<any>(`/instruments/bookings/${bookingId}`, {
      method: "DELETE",
    });
  }

  addMaintenanceRecord(
    instrumentId: string,
    data: {
      type: string;
      description: string;
      performedAt: string;
      nextDueDate?: string;
      cost?: number;
    },
  ) {
    return this.fetch<any>(`/instruments/${instrumentId}/maintenance`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Announcements
  getAnnouncements(teamId?: string) {
    const params = teamId ? `?teamId=${teamId}` : "";
    return this.fetch<any[]>(`/announcements${params}`);
  }

  createAnnouncement(data: { title: string; content: string; teamId: string }) {
    return this.fetch<any>("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Notifications
  getNotifications(page = 1) {
    return this.fetch<any>(`/notifications?page=${page}`);
  }

  getUnreadNotificationCount() {
    return this.fetch<{ count: number }>("/notifications/unread-count");
  }

  markNotificationRead(id: string) {
    return this.fetch<any>(`/notifications/${id}/read`, { method: "POST" });
  }

  markAllNotificationsRead() {
    return this.fetch<any>("/notifications/read-all", { method: "POST" });
  }

  // Audit
  getAuditLogs(page = 1, filters?: any) {
    const params = new URLSearchParams({ page: String(page) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, String(v));
      });
    }
    return this.fetch<any>(`/audit?${params}`);
  }

  // Experiment Templates
  getExperimentTemplates(teamId?: string, isPublic?: boolean) {
    const params = new URLSearchParams();
    if (teamId) params.set("teamId", teamId);
    if (isPublic !== undefined) params.set("isPublic", String(isPublic));
    return this.fetch<any[]>(`/experiment-templates?${params}`);
  }

  getExperimentTemplate(id: string) {
    return this.fetch<any>(`/experiment-templates/${id}`);
  }

  createExperimentTemplate(data: {
    name: string;
    description?: string;
    content?: any;
    category?: string;
    isPublic?: boolean;
    teamId: string;
  }) {
    return this.fetch<any>("/experiment-templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  deleteExperimentTemplate(id: string) {
    return this.fetch<any>(`/experiment-templates/${id}`, { method: "DELETE" });
  }

  // Protocol Execution
  startProtocolExecution(
    taskId: string,
    data: { protocolId: string; versionId: string },
  ) {
    return this.fetch<any>(`/tasks/${taskId}/protocol-execution`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getProtocolExecution(taskId: string) {
    return this.fetch<any>(`/tasks/${taskId}/protocol-execution`);
  }

  updateExecutionStep(
    executionId: string,
    stepId: string,
    data: { status?: string; notes?: string; deviations?: string },
  ) {
    return this.fetch<any>(
      `/protocol-executions/${executionId}/steps/${stepId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  }

  completeProtocolExecution(executionId: string) {
    return this.fetch<any>(`/protocol-executions/${executionId}/complete`, {
      method: "POST",
    });
  }

  // Health
  healthCheck() {
    return this.fetch<any>("/health");
  }
}

export const api = new ApiClient();
