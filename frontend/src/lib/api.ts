export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // 1. Localhost development
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.")
    ) {
      return envUrl || "http://localhost:4000/api";
    }

    // 2. Production build with explicit non-localhost URL
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }

    // 3. Dynamic domain resolution when on live domain
    if (hostname.includes("sandiwarno.tech")) {
      return `${protocol}//arjuna-api.sandiwarno.tech/api`;
    }
    if (hostname.startsWith("arjuna-lms.")) {
      return `${protocol}//${hostname.replace(/^arjuna-lms\./, "arjuna-api.")}/api`;
    }
    if (hostname.startsWith("lms.")) {
      return `${protocol}//${hostname.replace(/^lms\./, "api.")}/api`;
    }

    // Fallback for live production domain
    return "https://arjuna-api.sandiwarno.tech/api";
  }

  return envUrl || "http://localhost:4000/api";
}

interface ApiOptions extends RequestInit {
  json?: any;
  _skipRefresh?: boolean; // Internal flag to prevent infinite refresh loops
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Token Refresh Queue (prevents concurrent refresh storms) ─────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processPendingQueue(error: unknown = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(undefined);
    }
  });
  pendingQueue = [];
}

async function attemptTokenRefresh(): Promise<void> {
  if (isRefreshing) {
    // Another refresh is already in-flight — wait for it
    return new Promise((resolve, reject) => {
      pendingQueue.push({ resolve: resolve as any, reject });
    });
  }

  isRefreshing = true;
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Refresh failed");
    }

    // Refresh succeeded — new cookies are automatically set by the browser
    processPendingQueue();
  } catch (err) {
    processPendingQueue(err);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      window.location.href = `/login?from=${encodeURIComponent(currentPath)}&reason=session_expired`;
    }
  }
}

// ─── Core Request Function with Auto-Refresh & Timeout ───────────────

async function request<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { json, headers: customHeaders, _skipRefresh, timeoutMs = 15000, signal: customSignal, ...rest } = options;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  const apiBase = getApiBaseUrl();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = customSignal || controller.signal;

  try {
    const res = await fetch(`${apiBase}${endpoint}`, {
      ...rest,
      headers,
      signal,
      credentials: "include", // Send cookies (JWT httpOnly)
      body: json ? JSON.stringify(json) : options.body,
    });

    // ── Handle 401: attempt silent token refresh then retry ──
    if (res.status === 401 && !_skipRefresh) {
      // Don't try to refresh on auth endpoints themselves
      const isAuthEndpoint =
        endpoint === "/auth/refresh" || endpoint === "/auth/login";

      if (!isAuthEndpoint) {
        try {
          await attemptTokenRefresh();

          // Retry the original request with the new token
          const retryRes = await fetch(`${apiBase}${endpoint}`, {
            ...rest,
            headers,
            signal,
            credentials: "include",
            body: json ? JSON.stringify(json) : options.body,
          });

          if (!retryRes.ok) {
            const errorData = await retryRes.json().catch(() => ({}));
            // If still 401 after refresh, redirect to login
            if (retryRes.status === 401) {
              redirectToLogin();
            }
            throw new ApiError(
              retryRes.status,
              errorData.message || `API Error: ${retryRes.status}`,
              errorData
            );
          }

          if (retryRes.status === 204) {
            return {} as T;
          }

          return retryRes.json();
        } catch (refreshError) {
          if (refreshError instanceof ApiError) throw refreshError;
          // Refresh failed — session is truly expired, redirect to login
          redirectToLogin();
          throw new ApiError(401, "Session expired. Please login again.");
        }
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        errorData.message || `API Error: ${res.status}`,
        errorData
      );
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new ApiError(504, "Koneksi ke server timeout (15s). Silakan coba lagi.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      json: { email, password },
    }),

  refresh: () =>
    request("/auth/refresh", { method: "POST" }),

  logout: () =>
    request("/auth/logout", { method: "POST" }),

  me: () => request<{ user: User }>("/auth/me"),
};

// ─── Users ────────────────────────────────────────────────────────────

export const users = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/admin/users${query}`);
  },

  getById: (id: string) => request(`/admin/users/${id}`),

  create: (data: any) =>
    request("/admin/users", { method: "POST", json: data }),

  update: (id: string, data: any) =>
    request(`/admin/users/${id}`, { method: "PUT", json: data }),

  delete: (id: string) =>
    request(`/admin/users/${id}`, { method: "DELETE" }),

  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/admin/users/bulk-import", {
      method: "POST",
      body: formData,
    });
  },

  bulkDelete: (userIds: string[]) =>
    request("/admin/users/bulk-delete", {
      method: "POST",
      json: { userIds },
    }),

  bulkUpdateRole: (userIds: string[], role: string) =>
    request("/admin/users/bulk-update-role", {
      method: "POST",
      json: { userIds, role },
    }),

  bulkResetPassword: (userIds: string[], newPassword: string) =>
    request("/admin/users/bulk-reset-password", {
      method: "POST",
      json: { userIds, newPassword },
    }),

  resetPassword: (userId: string, newPassword: string) =>
    request(`/admin/users/${userId}/reset-password`, {
      method: "POST",
      json: { newPassword },
    }),
};

// ─── Courses ──────────────────────────────────────────────────────────

export const courses = {
  // Admin
  listAll: () => request("/admin/courses"),
  create: (data: any) =>
    request("/admin/courses", { method: "POST", json: data }),
  update: (id: string, data: any) =>
    request(`/admin/courses/${id}`, { method: "PUT", json: data }),
  delete: (id: string) =>
    request(`/admin/courses/${id}`, { method: "DELETE" }),
  enroll: (courseId: string, studentIds: string[]) =>
    request(`/admin/courses/${courseId}/enroll`, {
      method: "POST",
      json: { studentIds },
    }),
  unenroll: (courseId: string, studentId: string) =>
    request(`/admin/courses/${courseId}/students/${studentId}`, {
      method: "DELETE",
    }),

  // User-facing
  myCourses: () => request("/courses"),
  getById: (id: string) => request(`/courses/${id}`),
};

// ─── Threads ──────────────────────────────────────────────────────────

export const threads = {
  list: (courseId: string, params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request(`/courses/${courseId}/threads${query}`);
  },

  create: (
    courseId: string,
    data: {
      title: string;
      body: string;
      durationMinutes?: number;
      expiresAt?: string;
    }
  ) =>
    request(`/courses/${courseId}/threads`, { method: "POST", json: data }),

  getById: (threadId: string) => request(`/threads/${threadId}`),

  addMessage: (
    threadId: string,
    data: { type: string; body: string; parentMessageId?: string }
  ) =>
    request(`/threads/${threadId}/messages`, { method: "POST", json: data }),

  close: (threadId: string) =>
    request(`/threads/${threadId}/close`, { method: "PATCH" }),
};

// ─── Opinions ─────────────────────────────────────────────────────────

export const opinions = {
  create: (
    threadId: string,
    data: {
      targetStudentId?: string;
      opinionText?: string;
      sentiment?: string;
      emotion?: string;
    }
  ) =>
    request(`/threads/${threadId}/opinions`, { method: "POST", json: data }),

  list: (threadId: string) => request(`/threads/${threadId}/opinions`),
};

export const datasets = {
  getSummary: () => request("/admin/dataset/summary"),

  getPreview: (courseId?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.append("courseId", courseId);
    params.append("format", "json");
    return request<{ data: any[] }>(`/admin/dataset/export?${params.toString()}`);
  },

  exportUrl: (courseId?: string, format: "csv" | "json" = "csv") => {
    const params = new URLSearchParams();
    if (courseId) params.append("courseId", courseId);
    params.append("format", format);
    const apiBase = getApiBaseUrl();
    return `${apiBase}/admin/dataset/export?${params.toString()}`;
  },

  listThreads: (paramsObj?: {
    courseId?: string;
    labeledStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (paramsObj?.courseId) params.append("courseId", paramsObj.courseId);
    if (paramsObj?.labeledStatus && paramsObj.labeledStatus !== "ALL")
      params.append("labeledStatus", paramsObj.labeledStatus);
    if (paramsObj?.search) params.append("search", paramsObj.search);
    if (paramsObj?.page) params.append("page", String(paramsObj.page));
    if (paramsObj?.limit) params.append("limit", String(paramsObj.limit));
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return request<{ data: any[]; meta: any }>(`/admin/dataset/threads${queryStr}`);
  },

  autoLabelAll: (courseId?: string) =>
    request<{ success: boolean; totalProcessed: number; labeledCount: number }>(
      "/admin/dataset/auto-label-all",
      { method: "POST", json: { courseId: courseId || undefined } }
    ),

  setLabels: (threadId: string, data: any) =>
    request(`/admin/dataset/${threadId}/labels`, {
      method: "POST",
      json: data,
    }),

  deleteLabels: (threadId: string) =>
    request(`/admin/dataset/${threadId}/labels`, {
      method: "DELETE",
    }),

  getLabels: (threadId: string) => request(`/admin/dataset/${threadId}/labels`),
};

// ─── Academic LMS Module ──────────────────────────────────────────────

export const academic = {
  getOverview: () => request("/academic/overview"),

  updateSyllabus: (courseId: string, data: { description?: string; syllabus?: string }) =>
    request(`/courses/${courseId}/syllabus`, { method: "PATCH", json: data }),

  // Modules & Materials
  getModules: (courseId: string) => request<{ modules: any[]; stats: any }>(`/courses/${courseId}/modules`),
  createModule: (courseId: string, data: { title: string; description?: string; orderIndex?: number }) =>
    request(`/courses/${courseId}/modules`, { method: "POST", json: data }),
  createMaterial: (moduleId: string, data: any) =>
    request(`/modules/${moduleId}/materials`, { method: "POST", json: data }),
  toggleMaterialProgress: (materialId: string) =>
    request<{ completed: boolean }>(`/materials/${materialId}/toggle-progress`, { method: "POST" }),

  // Virtual Meetings
  getMeetings: (courseId: string) => request<any[]>(`/courses/${courseId}/meetings`),
  createMeeting: (courseId: string, data: any) =>
    request(`/courses/${courseId}/meetings`, { method: "POST", json: data }),

  // Announcements & Broadcast Notifications
  getCourseAnnouncements: (courseId: string) => request<any[]>(`/courses/${courseId}/announcements`),
  getGeneralAnnouncements: (courseId?: string) =>
    request<any[]>(courseId ? `/announcements?courseId=${courseId}` : "/announcements"),
  createAnnouncement: (courseId: string | undefined, data: any) =>
    request(courseId ? `/courses/${courseId}/announcements` : "/announcements", {
      method: "POST",
      json: data,
    }),
  updateAnnouncement: (id: string, data: any) =>
    request(`/announcements/${id}`, { method: "PATCH", json: data }),
  deleteAnnouncement: (id: string) =>
    request(`/announcements/${id}`, { method: "DELETE" }),

  // Admin Settings & Academic Config
  getSettings: () => request<any>("/admin/settings"),
  updateSettings: (data: any) =>
    request<any>("/admin/settings", { method: "PATCH", json: data }),
  getStudyGroups: (courseId: string) => request<any[]>(`/courses/${courseId}/groups`),

  // Assignments
  getAssignments: (courseId: string) => request<any[]>(`/courses/${courseId}/assignments`),
  createAssignment: (courseId: string, data: any) =>
    request(`/courses/${courseId}/assignments`, { method: "POST", json: data }),
  submitAssignment: (assignmentId: string, data: { fileUrl?: string; submittedText?: string }) =>
    request(`/assignments/${assignmentId}/submissions`, { method: "POST", json: data }),
  gradeSubmission: (submissionId: string, data: { score: number; feedback?: string }) =>
    request(`/submissions/${submissionId}/grade`, { method: "POST", json: data }),

  // Quizzes
  getQuizzes: (courseId: string) => request<any[]>(`/courses/${courseId}/quizzes`),
  getQuizDetails: (quizId: string) => request<any>(`/quizzes/${quizId}`),
  createQuiz: (courseId: string, data: any) =>
    request(`/courses/${courseId}/quizzes`, { method: "POST", json: data }),
  submitQuizAttempt: (quizId: string, data: { answers: any[] }) =>
    request(`/quizzes/${quizId}/attempt`, { method: "POST", json: data }),

  // Gradebook
  getGradebook: (courseId: string) => request<any>(`/courses/${courseId}/gradebook`),
};

// ─── Types ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "LECTURER" | "STUDENT";
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  syllabus?: string;
  term: string;
  lecturer: { id: string; name: string; email: string };
  _count: { enrollments: number; threads: number };
}

export interface Thread {
  id: string;
  title: string;
  initiatorRole: string;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string | null;
  expiresAt?: string | null;
  initiator: { id: string; name: string; role: string };
  _count: { messages: number; opinions: number };
  compliance?: {
    total: number;
    answered: number;
    pending: number;
  } | null;
}

export interface Message {
  id: string;
  type: "QUESTION" | "ANSWER" | "FEEDBACK" | "REACTION";
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: string };
  parentMessageId: string | null;
  parent?: {
    id: string;
    body: string;
    type: string;
    author: { id: string; name: string; role: string };
  } | null;
}

