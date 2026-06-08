"use client";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { useTranslations } from "@/i18n/locale-context";
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
      <span className="font-medium break-all text-start sm:text-end" dir="auto">
        {value}
      </span>
    </div>
  );
}

export function AdminSystemOverview({ overview, loading }: AdminSystemOverviewProps) {
  const t = useTranslations();
  const notAvailable = t.admin.systemOverview.notAvailable;

  function formatTimestamp(value: string | null | undefined): string {
    if (!value) return notAvailable;
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return value;
    return new Date(parsed).toLocaleString("ar-SA", { hour12: false });
  }

  return (
    <AdminDashboardCard
      title={t.admin.systemOverview.title}
      loading={loading}
      skeletonLines={6}
      className="lg:col-span-3"
    >
      <div className="space-y-3">
        <InfoRow
          label={t.admin.systemOverview.applicationVersion}
          value={displaySystemValue(overview?.applicationVersion) || notAvailable}
        />
        <InfoRow
          label={t.admin.systemOverview.gitCommit}
          value={displaySystemValue(overview?.gitCommit) || notAvailable}
        />
        <InfoRow
          label={t.admin.systemOverview.lastDeploymentTime}
          value={
            overview?.lastDeploymentTime
              ? formatTimestamp(overview.lastDeploymentTime)
              : notAvailable
          }
        />
        <InfoRow
          label={t.admin.systemOverview.environment}
          value={displaySystemValue(overview?.environment) || notAvailable}
        />
        <InfoRow
          label={t.admin.systemOverview.apiBaseUrl}
          value={displaySystemValue(overview?.apiBaseUrl) || notAvailable}
        />
        <InfoRow
          label={t.admin.systemOverview.refreshedAt}
          value={formatTimestamp(overview?.refreshedAt)}
        />
      </div>
    </AdminDashboardCard>
  );
}
