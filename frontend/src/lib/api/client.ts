import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import { getSessionId, setSessionId, clearSessionId, isValidSessionId } from "@/lib/session";
import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  Category,
  CategoryDetectResult,
  Comparison,
  ComparisonCreated,
  CreateComparisonPayload,
  Model,
  PreferencesData,
  PreferencesSummaryData,
  SessionData,
  Vote,
} from "@/lib/api/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/v1";

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
    baseURL: BASE_URL,
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

export const api = {
  async ensureSession(): Promise<string> {
    const existing = getSessionId();
    if (existing && isValidSessionId(existing)) {
      return existing;
    }
    if (existing) {
      clearSessionId();
    }
    const session = await unwrap(client.post<ApiEnvelope<SessionData>>("/sessions"));
    setSessionId(session.session_id);
    return session.session_id;
  },

  getCategories(): Promise<{ categories: Category[]; default_key?: string; supports_auto_detect?: boolean }> {
    return unwrap(client.get("/categories")).then((data) => ({
      categories: (data as { categories: Category[] }).categories,
      default_key: (data as { categories: Category[] }).categories ? "general" : undefined,
    }));
  },

  async getCategoriesFull() {
    const res = await client.get<ApiEnvelope<{ categories: Category[] }>>("/categories");
    return {
      categories: res.data.data.categories,
      meta: res.data.meta,
    };
  },

  detectCategory(prompt: string): Promise<CategoryDetectResult> {
    return unwrap(client.post("/categories/detect", { prompt }));
  },

  getModels(): Promise<Model[]> {
    return unwrap(client.get<ApiEnvelope<{ models: Model[] }>>("/models")).then((d) => d.models);
  },

  getModel(id: string): Promise<Model> {
    return unwrap(client.get(`/models/${id}`));
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

  getComparison(id: string): Promise<Comparison> {
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
};

export default api;
