import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { ar } from "@/i18n/ar";
import type { RecentActivityItem } from "@/lib/admin/activity";

interface AdminActivitySectionProps {
  activity: RecentActivityItem[] | null | undefined;
  loading: boolean;
}

export function AdminActivitySection({ activity, loading }: AdminActivitySectionProps) {
  const items = Array.isArray(activity) ? activity : [];

  return (
    <AdminDashboardCard
      title={ar.admin.recentActivity.title}
      loading={loading}
      skeletonLines={3}
      className="sm:col-span-2 lg:col-span-3"
    >
      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pe-4 text-start font-medium">
                  {ar.admin.recentActivity.timestamp}
                </th>
                <th className="py-2 pe-4 text-start font-medium">
                  {ar.admin.recentActivity.activityType}
                </th>
                <th className="py-2 text-start font-medium">{ar.admin.recentActivity.status}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.activityType}-${index}`} className="border-b border-border/50">
                  <td className="py-2 pe-4">{item.timestamp ?? "—"}</td>
                  <td className="py-2 pe-4">{item.activityType}</td>
                  <td className="py-2">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{ar.admin.recentActivity.empty}</p>
      )}
    </AdminDashboardCard>
  );
}
