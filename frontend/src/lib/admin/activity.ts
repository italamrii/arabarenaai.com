export interface RecentActivityItem {
  timestamp: string | null;
  activityType: string;
  status: string;
}

export function buildRecentActivity(): RecentActivityItem[] {
  return [];
}
