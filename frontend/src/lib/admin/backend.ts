import { getApiBaseUrl, normalizeApiBaseUrl } from "@/lib/api/base-url";
import type { AdminStatsData } from "@/lib/admin/admin-stats";
import type { Model } from "@/lib/api/types";

const PRODUCTION_API_BASE_URL = "https://api.arabarenaai.com/v1";
const ADMIN_FETCH_LOG_PREFIX = "[admin-dashboard-fetch]";

interface ApiEnvelope<T> {
  data?: T;
}

function isProductionRuntime(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "production") return true;
  if (vercelEnv === "preview" || vercelEnv === "development") return false;
  return process.env.NODE_ENV?.trim().toLowerCase() === "production";
}

/** Server-side API base for admin loader (not used by public compare client). */
export function resolveAdminApiBaseUrl(): string {
  const fromEnv =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();

  if (fromEnv) {
    return normalizeApiBaseUrl(fromEnv);
  }

  if (isProductionRuntime()) {
    return PRODUCTION_API_BASE_URL;
  }

  return getApiBaseUrl();
}

function logAdminFetchFailure(
  path: string,
  details: {
    apiBaseUrl: string;
    status?: number;
    reason: string;
    bodyPreview?: string;
    errorMessage?: string;
  },
): void {
  console.error(ADMIN_FETCH_LOG_PREFIX, {
    path,
    apiBaseUrl: details.apiBaseUrl,
    status: details.status,
    reason: details.reason,
    bodyPreview: details.bodyPreview,
    errorMessage: details.errorMessage,
  });
}

function previewBody(text: string): string {
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

async function fetchEnvelope<T>(path: string): Promise<T | null> {
  const apiBaseUrl = resolveAdminApiBaseUrl();
  const url = `${apiBaseUrl}${path}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const bodyText = await response.text();

    if (!response.ok) {
      logAdminFetchFailure(path, {
        apiBaseUrl,
        status: response.status,
        reason: "http_error",
        bodyPreview: previewBody(bodyText),
      });
      return null;
    }

    let json: ApiEnvelope<T>;
    try {
      json = JSON.parse(bodyText) as ApiEnvelope<T>;
    } catch (error) {
      logAdminFetchFailure(path, {
        apiBaseUrl,
        status: response.status,
        reason: "json_parse_error",
        errorMessage: error instanceof Error ? error.message : String(error),
        bodyPreview: previewBody(bodyText),
      });
      return null;
    }

    if (json.data == null) {
      logAdminFetchFailure(path, {
        apiBaseUrl,
        status: response.status,
        reason: "missing_data_envelope",
        bodyPreview: previewBody(bodyText),
      });
      return null;
    }

    return json.data;
  } catch (error) {
    logAdminFetchFailure(path, {
      apiBaseUrl,
      reason: "fetch_exception",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function safeModelCount(payload: { models?: unknown } | null): number | null {
  if (!payload || !Array.isArray(payload.models)) return null;
  return payload.models.length;
}

function safeModelList(payload: { models?: unknown } | null): Model[] | null {
  if (!payload || !Array.isArray(payload.models)) return null;
  return payload.models as Model[];
}

function safeProviderList<T>(
  payload: { providers?: unknown } | null,
): T[] | null {
  if (!payload || !Array.isArray(payload.providers)) return null;
  return payload.providers as T[];
}

export interface AdminDashboardBackendData {
  health: { status: string; version: string } | null;
  totalModels: number | null;
  enabledModels: number | null;
  models: Model[] | null;
  providerHealth: Array<{
    key: string;
    name_ar: string;
    status: string;
    latency_ms?: number | null;
    message_ar?: string | null;
  }> | null;
  comparisons: {
    started: number;
    completed: number;
    partial: number;
    failed: number;
    active: number;
  } | null;
  deployment: {
    status: string;
    version: string;
    uptime_seconds?: number;
    database_status?: string;
  } | null;
  providerErrors: Array<{
    key: string;
    name_ar: string;
    last_error_type: string | null;
    failures: number;
  }> | null;
  adminStats: AdminStatsData | null;
  diagnosticsAvailable: boolean;
}

const EMPTY_DASHBOARD_DATA: AdminDashboardBackendData = {
  health: null,
  totalModels: null,
  enabledModels: null,
  models: null,
  providerHealth: null,
  comparisons: null,
  deployment: null,
  providerErrors: null,
  adminStats: null,
  diagnosticsAvailable: false,
};

function buildDiagnosticsFields(
  diagnostics: {
    status?: string;
    version?: string;
    uptime_seconds?: number;
    comparisons?: {
      started: number;
      completed: number;
      partial: number;
      failed: number;
      active: number;
    };
    providers?: Array<{
      key: string;
      name_ar: string;
      last_error_type: string | null;
      failures: number;
    }>;
    database?: { status?: string };
  } | null,
): Pick<AdminDashboardBackendData, "comparisons" | "deployment" | "providerErrors" | "diagnosticsAvailable"> {
  if (!diagnostics) {
    return {
      comparisons: null,
      deployment: null,
      providerErrors: null,
      diagnosticsAvailable: false,
    };
  }

  const comparisons =
    diagnostics.comparisons &&
    typeof diagnostics.comparisons === "object" &&
    "started" in diagnostics.comparisons
      ? diagnostics.comparisons
      : null;

  const providerErrors = Array.isArray(diagnostics.providers)
    ? diagnostics.providers.map((provider) => ({
        key: String(provider.key ?? ""),
        name_ar: String(provider.name_ar ?? ""),
        last_error_type: provider.last_error_type ?? null,
        failures: Number(provider.failures) || 0,
      }))
    : null;

  const deployment =
    diagnostics.status && diagnostics.version
      ? {
          status: String(diagnostics.status),
          version: String(diagnostics.version),
          uptime_seconds:
            typeof diagnostics.uptime_seconds === "number"
              ? diagnostics.uptime_seconds
              : undefined,
          database_status: diagnostics.database?.status,
        }
      : null;

  return {
    comparisons,
    deployment,
    providerErrors,
    diagnosticsAvailable: Boolean(comparisons || deployment || providerErrors),
  };
}

export async function loadAdminDashboardData(): Promise<AdminDashboardBackendData> {
  try {
    const [health, allModels, enabledModels, providerHealth, diagnostics, adminStats] =
      await Promise.all([
        fetchEnvelope<{ status: string; version: string }>("/health"),
        fetchEnvelope<{ models: unknown[] }>("/models?enabled_only=false"),
        fetchEnvelope<{ models: unknown[] }>("/models?enabled_only=true"),
        fetchEnvelope<{
          providers: Array<{
            key: string;
            name_ar: string;
            status: string;
            latency_ms?: number | null;
            message_ar?: string | null;
          }>;
        }>("/health/providers"),
        fetchEnvelope<{
          status: string;
          version: string;
          uptime_seconds: number;
          comparisons: {
            started: number;
            completed: number;
            partial: number;
            failed: number;
            active: number;
          };
          providers: Array<{
            key: string;
            name_ar: string;
            last_error_type: string | null;
            failures: number;
          }>;
          database: { status?: string };
        }>("/health/diagnostics"),
        fetchEnvelope<AdminStatsData>("/health/admin-stats"),
      ]);

    const diagnosticsFields = buildDiagnosticsFields(diagnostics);

    return {
      health,
      totalModels: safeModelCount(allModels),
      enabledModels: safeModelCount(enabledModels),
      models: safeModelList(allModels),
      providerHealth: safeProviderList(providerHealth),
      adminStats,
      ...diagnosticsFields,
    };
  } catch {
    return { ...EMPTY_DASHBOARD_DATA };
  }
}
