import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { ar } from "@/i18n/ar";
import { displaySystemValue } from "@/lib/admin/system-info";
import type { SystemOverview } from "@/lib/admin/system-info";

interface AdminSystemOverviewProps {
  overview: SystemOverview | null | undefined;
  loading: boolean;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium break-all text-start sm:text-end">{value}</span>
    </div>
  );
}

export function AdminSystemOverview({ overview, loading }: AdminSystemOverviewProps) {
  const notAvailable = ar.admin.systemOverview.notAvailable;

  return (
    <AdminDashboardCard
      title={ar.admin.systemOverview.title}
      loading={loading}
      skeletonLines={4}
      className="lg:col-span-3"
    >
      <div className="space-y-3">
        <InfoRow
          label={ar.admin.systemOverview.applicationVersion}
          value={displaySystemValue(overview?.applicationVersion) || notAvailable}
        />
        <InfoRow
          label={ar.admin.systemOverview.gitCommit}
          value={displaySystemValue(overview?.gitCommit) || notAvailable}
        />
        <InfoRow
          label={ar.admin.systemOverview.lastDeploymentTime}
          value={displaySystemValue(overview?.lastDeploymentTime) || notAvailable}
        />
        <InfoRow
          label={ar.admin.systemOverview.environment}
          value={displaySystemValue(overview?.environment) || notAvailable}
        />
      </div>
    </AdminDashboardCard>
  );
}
