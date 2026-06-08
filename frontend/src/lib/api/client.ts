import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL } from "@/lib/api/base-url";
import {
  getSessionId,
  setSessionId,
  clearSessionId,
  isValidSessionId,
  isLegacySessionId,
} from "@/lib/session";
import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  ApiMeta,
  Category,
  CategoryDetectResult,
  Comparison,
  ComparisonCreated,
  CreateComparisonPayload,
  Model,
  PreferencesData,
  PreferencesSummaryData,
  ProviderHealthData,
  ProviderHealthItem,
  SessionData,
  UploadResult,
  Vote,
} from "@/lib/api/types";

export class ApiClientError extends Error {
  code: string;
  messageAr: string;
  status: number;

  constructor(code: string, messageAr: string, messageEn: string, status: number) {
    super(messageEn);
    this.code = code;
    this.messageAr = messageAr;
    this.status = status;
    this.name = "ApiClientError";
  }
}

function setSessionHeader(config: InternalAxiosRequestConfig, sessionId: string): void {
  if (typeof config.headers.set === "function") {
    config.headers.set("X-Session-Id", sessionId);
  } else {
    config.headers["X-Session-Id"] = sessionId;
  }
}

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
    timeout: 60000,
  });

  client.interceptors.request.use((config) => {
    const sessionId = getSessionId();
    if (sessionId && isValidSessionId(sessionId)) {
      setSessionHeader(config, sessionId);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorEnvelope>) => {
      const payload = error.response?.data?.error;
      if (payload) {
        throw new ApiClientError(
          payload.code,
          payload.message,
          payload.message_en,
          error.response?.status ?? 500,
        );
      }
      throw new ApiClientError(
        "NETWORK_ERROR",
        "تعذر الاتصال بالخادم",
        error.message || "Network error",
        error.response?.status ?? 0,
      );
    },
  );

  return client;
}

const client = createClient();

async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data;
}

/** Read backend envelope: axios response.data → { data, meta }. */
function readEnvelope<T>(response: { data: ApiEnvelope<T> }): { payload: T; meta?: ApiMeta } {
  return {
    payload: response.data.data,
    meta: response.data.meta,
  };
}

export const api = {
  async ensureSession(): Promise<string> {
    const existing = getSessionId();
    if (existing && isValidSessionId(existing)) {
      return existing;
    }
    if (existing && isLegacySessionId(existing)) {
      const upgraded = await unwrap(
        client.post<ApiEnvelope<SessionData>>("/sessions/upgrade", {
          legacy_session_id: existing,
        }),
      );
      setSessionId(upgraded.session_id);
      return upgraded.session_id;
    }
    if (existing) {
      clearSessionId();
    }
    const session = await unwrap(client.post<ApiEnvelope<SessionData>>("/sessions"));
    setSessionId(session.session_id);
    return session.session_id;
  },

  async getCategories(): Promise<Category[]> {
    const res = await client.get<ApiEnvelope<{ categories: Category[] }>>("/categories");
    return readEnvelope(res).payload.categories;
  },

  async getCategoriesFull() {
    const res = await client.get<ApiEnvelope<{ categories: Category[] }>>("/categories");
    const { payload, meta } = readEnvelope(res);
    return {
      categories: payload.categories,
      meta,
    };
  },

  detectCategory(prompt: string): Promise<CategoryDetectResult> {
    return unwrap(client.post("/categories/detect", { prompt }));
  },

  async getModelsFull() {
    const res = await client.get<ApiEnvelope<{ models: Model[] }>>("/models", {
      params: { enabled_only: true },
    });
    const { payload, meta } = readEnvelope(res);
    return {
      models: payload.models,
      meta,
    };
  },

  getModels(): Promise<Model[]> {
    return this.getModelsFull().then((r) => r.models);
  },

  getModel(id: string): Promise<Model> {
    return unwrap(client.get(`/models/${id}`));
  },

  async uploadAttachment(file: File): Promise<UploadResult> {
    const sessionId = await this.ensureSession();
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await client.post<ApiEnvelope<UploadResult>>("/uploads", formData, {
        headers: { "X-Session-Id": sessionId },
      });
      return readEnvelope(res).payload;
    } catch (err) {
      if (err instanceof ApiClientError) throw err;
      throw new ApiClientError(
        "UPLOAD_FAILED",
        "تعذر رفع الملف",
        "Upload failed",
        0,
      );
    }
  },

  async createComparison(payload: CreateComparisonPayload): Promise<ComparisonCreated> {
    const sessionId = await this.ensureSession();
    return unwrap(
      client.post("/comparisons", payload, {
        headers: { "X-Session-Id": sessionId },
        params: { session_id: sessionId },
      }),
    );
  },

  async getComparison(id: string): Promise<Comparison> {
    await this.ensureSession();
    return unwrap(client.get(`/comparisons/${id}`));
  },

  async castVote(comparisonId: string, responseId: string): Promise<Vote> {
    const sessionId = await this.ensureSession();
    return unwrap(
      client.post(
        `/comparisons/${comparisonId}/votes`,
        { response_id: responseId },
        {
          headers: { "X-Session-Id": sessionId },
          params: { session_id: sessionId },
        },
      ),
    );
  },

  getPreferences(params?: { category_key?: string; period?: string }): Promise<PreferencesData> {
    return unwrap(client.get("/analytics/preferences", { params }));
  },

  getPreferencesSummary(period = "all_time"): Promise<PreferencesSummaryData> {
    return unwrap(client.get("/analytics/preferences/summary", { params: { period } }));
  },

  health(): Promise<{ status: string; version: string }> {
    return unwrap(client.get("/health"));
  },

  /** Optional warning data — failures must not block model/category UI. */
  async getProviderHealth(): Promise<ProviderHealthItem[] | null> {
    try {
      const res = await client.get<ApiEnvelope<ProviderHealthData>>("/health/providers");
      const providers = readEnvelope(res).payload.providers;
      return Array.isArray(providers) ? providers : null;
    } catch {
      return null;
    }
  },
};

export { API_BASE_URL } from "@/lib/api/base-url";

export default api;
