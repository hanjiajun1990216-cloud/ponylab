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
    return this.fetch<{ accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  register(data: { email: string; password: string; firstName: string; lastName: string }) {
    return this.fetch<{ accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
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

  createTeam(data: { name: string; description?: string }) {
    return this.fetch<any>("/teams", { method: "POST", body: JSON.stringify(data) });
  }

  // Projects
  getProjectsByTeam(teamId: string, page = 1) {
    return this.fetch<any>(`/projects/team/${teamId}?page=${page}`);
  }

  createProject(data: { name: string; description?: string; teamId: string }) {
    return this.fetch<any>("/projects", { method: "POST", body: JSON.stringify(data) });
  }

  // Experiments
  getExperimentsByProject(projectId: string, page = 1) {
    return this.fetch<any>(`/experiments/project/${projectId}?page=${page}`);
  }

  getExperiment(id: string) {
    return this.fetch<any>(`/experiments/${id}`);
  }

  createExperiment(data: { title: string; projectId: string }) {
    return this.fetch<any>("/experiments", { method: "POST", body: JSON.stringify(data) });
  }

  updateExperiment(id: string, data: any) {
    return this.fetch<any>(`/experiments/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  }

  // Samples
  getSamples(page = 1, filters?: { sampleType?: string; status?: string }) {
    const params = new URLSearchParams({ page: String(page) });
    if (filters?.sampleType) params.set("sampleType", filters.sampleType);
    if (filters?.status) params.set("status", filters.status);
    return this.fetch<any>(`/samples?${params}`);
  }

  createSample(data: any) {
    return this.fetch<any>("/samples", { method: "POST", body: JSON.stringify(data) });
  }

  // Inventory
  getInventory(page = 1, category?: string) {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set("category", category);
    return this.fetch<any>(`/inventory?${params}`);
  }

  adjustInventory(id: string, data: { action: string; amount: number; reason?: string }) {
    return this.fetch<any>(`/inventory/${id}/adjust`, { method: "POST", body: JSON.stringify(data) });
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

  // Health
  healthCheck() {
    return this.fetch<any>("/health");
  }
}

export const api = new ApiClient();
