import { getApiBaseUrl } from "@/lib/api/base-url";

interface ApiEnvelope<T> {
  data?: T;
}

async function fetchEnvelope<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const json = (await response.json()) as ApiEnvelope<T>;
    if (json.data == null) return null;
    return json.data;
  } catch {
    return null;
  }
}

function safeModelCount(payload: { models?: unknown } | null): number | null {
  if (!payload || !Array.isArray(payload.models)) return null;
  return payload.models.length;
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
  providerHealth: Array<{
    key: string;
    name_ar: string;
    status: string;
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
  diagnosticsAvailable: boolean;
}

const EMPTY_DASHBOARD_DATA: AdminDashboardBackendData = {
  health: null,
  totalModels: null,
  enabledModels: null,
  providerHealth: null,
  comparisons: null,
  deployment: null,
  providerErrors: null,
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
    const [health, allModels, enabledModels, providerHealth, diagnostics] =
      await Promise.all([
        fetchEnvelope<{ status: string; version: string }>("/health"),
        fetchEnvelope<{ models: unknown[] }>("/models?enabled_only=false"),
        fetchEnvelope<{ models: unknown[] }>("/models?enabled_only=true"),
        fetchEnvelope<{
          providers: Array<{
            key: string;
            name_ar: string;
            status: string;
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
      ]);

    const diagnosticsFields = buildDiagnosticsFields(diagnostics);

    return {
      health,
      totalModels: safeModelCount(allModels),
      enabledModels: safeModelCount(enabledModels),
      providerHealth: safeProviderList(providerHealth),
      ...diagnosticsFields,
    };
  } catch {
    return { ...EMPTY_DASHBOARD_DATA };
  }
}
