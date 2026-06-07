import type { AdminDashboardBackendData } from "@/lib/admin/backend";

export interface SystemErrorItem {
  source: string;
  errorType: string | null;
  failures: number;
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
