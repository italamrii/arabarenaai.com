import type { AdminDashboardBackendData } from "@/lib/admin/backend";
import type { AdminRecentError } from "@/lib/admin/admin-stats";

export interface SystemErrorItem {
  source: string;
  errorType: string | null;
  failures: number;
}

export interface ExecutionErrorItem {
  timestamp: string | null;
  provider: string | null;
  model: string | null;
  messageAr: string | null;
  errorCode: string | null;
  requestId: string | null;
}

export function buildErrorMonitoring(data: AdminDashboardBackendData): SystemErrorItem[] {
  if (!data.diagnosticsAvailable || !Array.isArray(data.providerErrors)) {
    return [];
  }

  return data.providerErrors
    .filter((provider) => provider.failures > 0 || provider.last_error_type)
    .map((provider) => ({
      source: provider.name_ar || provider.key,
      errorType: provider.last_error_type,
      failures: provider.failures,
    }));
}

export function buildExecutionErrors(
  recentErrors: AdminRecentError[] | null | undefined,
): ExecutionErrorItem[] {
  if (!Array.isArray(recentErrors)) return [];

  return recentErrors.map((error) => ({
    timestamp: error.occurred_at || null,
    provider: error.provider_name_ar || error.provider_key,
    model: error.model_name_ar,
    messageAr: error.error_message_ar,
    errorCode: error.error_code,
    requestId: error.request_id,
  }));
}
