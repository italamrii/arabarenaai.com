import type { RecentActivityItem } from "@/lib/admin/activity";
import type { SystemErrorItem } from "@/lib/admin/errors";
import type { ProviderStatusItem } from "@/lib/admin/providers";
import type { SystemOverview } from "@/lib/admin/system-info";
import type { AdminDashboardBackendData } from "@/lib/admin/backend";

export interface AdminDashboardPayload extends AdminDashboardBackendData {
  systemOverview: SystemOverview;
  providerStatuses: ProviderStatusItem[];
  recentActivity: RecentActivityItem[];
  errorMonitoring: SystemErrorItem[];
}

export interface AdminDashboardApiResponse {
  data: AdminDashboardPayload;
  spendingLimits: null;
}
