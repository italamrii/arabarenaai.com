import type { AdminRecentActivity } from "@/lib/admin/admin-stats";

export interface RecentActivityItem {
  timestamp: string | null;
  activityType: string;
  status: string;
}

export function buildRecentActivity(
  activity: AdminRecentActivity[] | null | undefined,
): RecentActivityItem[] {
  if (!Array.isArray(activity)) return [];

  return activity.map((item) => ({
    timestamp: item.occurred_at || null,
    activityType: item.activity_type,
    status: item.status,
  }));
}
