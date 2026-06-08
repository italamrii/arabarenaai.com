import type { RecentActivityItem } from "@/lib/admin/activity";
import type { ExecutionErrorItem, SystemErrorItem } from "@/lib/admin/errors";
import type { ModelStats } from "@/lib/admin/model-stats";
import type { ProviderStatusItem } from "@/lib/admin/providers";
import type { SystemOverview } from "@/lib/admin/system-info";
import type { AdminDashboardBackendData } from "@/lib/admin/backend";

export interface AdminDashboardPayload extends AdminDashboardBackendData {
  systemOverview: SystemOverview;
  providerStatuses: ProviderStatusItem[];
  modelStats: ModelStats | null;
  recentActivity: RecentActivityItem[];
  errorMonitoring: SystemErrorItem[];
  executionErrors: ExecutionErrorItem[];
}

export interface AdminDashboardApiResponse {
  data: AdminDashboardPayload;
  spendingLimits: null;
}
