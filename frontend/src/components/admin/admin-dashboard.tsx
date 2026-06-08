"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminActivitySection } from "@/components/admin/admin-activity-section";
import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { AdminDashboardErrorBoundary } from "@/components/admin/admin-dashboard-error-boundary";
import { AdminErrorMonitoring } from "@/components/admin/admin-error-monitoring";
import { AdminExecutionErrors } from "@/components/admin/admin-execution-errors";
import { AdminProviderStatus } from "@/components/admin/admin-provider-status";
import { AdminSystemControls } from "@/components/admin/admin-system-controls";
import { AdminSystemOverview } from "@/components/admin/admin-system-overview";
import { AdminUsageSignalsSection } from "@/components/admin/admin-usage-signals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-context";
import type { AdminDashboardBackendData } from "@/lib/admin/backend";
import type { AdminDashboardApiResponse, AdminDashboardPayload } from "@/lib/admin/types";

export function AdminDashboard() {
  const t = useTranslations();
  const router = useRouter();

  const NA = t.admin.notAvailable;

  function formatValue(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return NA;
    return String(value);
  }

  function formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return NA;
    return `${Math.round(value * 100)}%`;
  }

  function deploymentStatusLabel(status: string | undefined): string {
    if (!status) return NA;
    if (status === "ok" || status === "healthy") return t.admin.providerStatus.healthy;
    if (status === "degraded") return t.admin.providerStatus.degraded;
    if (status === "unavailable" || status === "unhealthy" || status === "down") {
      return t.admin.providerStatus.unavailable;
    }
    return t.admin.providerStatus.unknown;
  }
  const [payload, setPayload] = useState<AdminDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!response.ok) {
        setPayload(emptyDashboardPayload());
        return;
      }

      let json: AdminDashboardApiResponse;
      try {
        json = (await response.json()) as AdminDashboardApiResponse;
      } catch {
        json = { data: emptyDashboardPayload(), spendingLimits: null };
      }

      setPayload(normalizeDashboardPayload(json.data));
    } catch {
      setPayload(emptyDashboardPayload());
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  const data = payload;
  const dbComparisons = data?.adminStats?.comparisons;
  const runtimeComparisons = data?.comparisons;
  const providerHealthAvailable = Array.isArray(data?.providerHealth) && data.providerHealth.length > 0;
  const adminStatsAvailable = Boolean(data?.adminStats);
  const modelStats = data?.modelStats;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t.admin.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void loadData()} disabled={loading}>
            {loading ? "..." : null}
            {t.admin.refresh}
          </Button>
          <Button variant="outline" onClick={() => void handleLogout()}>
            {t.admin.logout}
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.admin.systemControls.title}</h2>
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminSystemControls />
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.admin.systemOverview.title}</h2>
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminSystemOverview overview={data?.systemOverview} loading={loading} />
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.admin.providerStatus.title}</h2>
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminProviderStatus
              providers={data?.providerStatuses}
              loading={loading}
              providerHealthAvailable={providerHealthAvailable}
            />
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.admin.sections.modelStats}</h2>
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminDashboardCard title={t.admin.cards.totalModels} loading={loading}>
              {formatValue(modelStats?.total ?? data?.totalModels ?? null)}
            </AdminDashboardCard>
            <AdminDashboardCard title={t.admin.cards.selectableModels} loading={loading}>
              {formatValue(modelStats?.selectable ?? null)}
            </AdminDashboardCard>
            <AdminDashboardCard title={t.admin.cards.placeholderModels} loading={loading}>
              {formatValue(modelStats?.placeholder ?? null)}
            </AdminDashboardCard>
            <AdminDashboardCard title={t.admin.cards.unavailableProviderModels} loading={loading}>
              {formatValue(modelStats?.unavailableProvider ?? null)}
            </AdminDashboardCard>
            <AdminDashboardCard
              title={t.admin.cards.modelsByProvider}
              loading={loading}
              skeletonLines={5}
              className="sm:col-span-2 lg:col-span-3"
            >
              {modelStats?.byProvider?.length ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {modelStats.byProvider.map((item) => (
                    <li key={item.providerKey} className="flex justify-between gap-2">
                      <span>{item.providerNameAr}</span>
                      <span className="tabular-nums">{item.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">{t.admin.noDataYet}</span>
              )}
            </AdminDashboardCard>
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.admin.cards.recentComparisons}</h2>
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminDashboardCard title={t.admin.cards.database} loading={loading} skeletonLines={6}>
              {adminStatsAvailable && dbComparisons ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    {t.admin.comparisons.total}: {dbComparisons.total}
                  </li>
                  <li>
                    {t.admin.comparisons.completed}: {dbComparisons.completed}
                  </li>
                  <li>
                    {t.admin.comparisons.partial}: {dbComparisons.partial}
                  </li>
                  <li>
                    {t.admin.comparisons.failed}: {dbComparisons.failed}
                  </li>
                  <li>
                    {t.admin.comparisons.pending}: {dbComparisons.pending}
                  </li>
                  <li>
                    {t.admin.comparisons.today}: {dbComparisons.today}
                  </li>
                  <li>
                    {t.admin.comparisons.avgResponseTime}:{" "}
                    {dbComparisons.avg_response_time_ms != null
                      ? `${dbComparisons.avg_response_time_ms} ms`
                      : NA}
                  </li>
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">{t.admin.notAvailable}</span>
              )}
            </AdminDashboardCard>

            <AdminDashboardCard title={t.admin.comparisons.runtimeStarted} loading={loading} skeletonLines={5}>
              {data?.diagnosticsAvailable && runtimeComparisons ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    {t.admin.comparisons.completed}: {runtimeComparisons.completed ?? NA}
                  </li>
                  <li>
                    {t.admin.comparisons.pending}: {runtimeComparisons.active ?? NA}
                  </li>
                  <li>
                    {t.admin.comparisons.partial}: {runtimeComparisons.partial ?? NA}
                  </li>
                  <li>
                    {t.admin.comparisons.failed}: {runtimeComparisons.failed ?? NA}
                  </li>
                  <li>
                    {t.admin.comparisons.started}: {runtimeComparisons.started ?? NA}
                  </li>
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">{t.admin.notAvailable}</span>
              )}
            </AdminDashboardCard>

            <AdminDashboardCard title={t.admin.cards.deploymentStatus} loading={loading} skeletonLines={4}>
              {data?.diagnosticsAvailable && data.deployment ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>{t.admin.deployment.status}</span>
                    <Badge variant="secondary">{deploymentStatusLabel(data.deployment.status)}</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {t.admin.deployment.version}: {data.deployment.version}
                  </p>
                  {data.deployment.uptime_seconds != null ? (
                    <p className="text-muted-foreground">
                      {t.admin.deployment.uptime}: {Math.floor(data.deployment.uptime_seconds / 60)}{" "}
                      {t.admin.deployment.uptimeUnit}
                    </p>
                  ) : null}
                  {data.deployment.database_status ? (
                    <p className="text-muted-foreground">
                      {t.admin.deployment.database}: {data.deployment.database_status}
                    </p>
                  ) : null}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">{t.admin.notAvailable}</span>
              )}
            </AdminDashboardCard>

          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t.admin.cards.usageInsights}</h2>
        <AdminDashboardErrorBoundary>
          <AdminUsageSignalsSection
            signals={data?.adminStats?.usage_signals}
            loading={loading}
            available={adminStatsAvailable}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            <AdminDashboardCard title={t.admin.cards.totalVotes} loading={loading}>
              {formatValue(data?.adminStats?.total_votes ?? null)}
            </AdminDashboardCard>

            <AdminDashboardCard title={t.admin.cards.uploads} loading={loading} skeletonLines={4}>
              {data?.adminStats?.uploads ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>
                    {t.admin.uploads.total}: {data.adminStats.uploads.total}
                  </li>
                  <li>
                    {t.admin.uploads.today}: {data.adminStats.uploads.today}
                  </li>
                  <li>
                    {t.admin.uploads.images}: {data.adminStats.uploads.images}
                  </li>
                  <li>
                    {t.admin.uploads.pdfs}: {data.adminStats.uploads.pdfs}
                  </li>
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">{t.admin.notAvailable}</span>
              )}
            </AdminDashboardCard>

            <AdminDashboardCard
              title={t.admin.cards.providerSuccessRate}
              loading={loading}
              skeletonLines={6}
              className="sm:col-span-2 lg:col-span-3"
            >
              {data?.adminStats?.provider_execution?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 pe-4 text-start font-medium">
                          {t.admin.providerStatus.title}
                        </th>
                        <th className="py-2 pe-4 text-start font-medium">{t.admin.cards.mostSelectedModels}</th>
                        <th className="py-2 pe-4 text-start font-medium">{t.admin.cards.providerSuccessRate}</th>
                        <th className="py-2 text-start font-medium">{t.admin.cards.avgResponseTime}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.adminStats.provider_execution.map((item) => (
                        <tr key={item.provider_key} className="border-b border-border/50">
                          <td className="py-2 pe-4">{item.provider_name_ar}</td>
                          <td className="py-2 pe-4 tabular-nums">{item.selection_count}</td>
                          <td className="py-2 pe-4">{formatPercent(item.success_rate)}</td>
                          <td className="py-2">
                            {item.avg_response_time_ms != null
                              ? `${item.avg_response_time_ms} ms`
                              : NA}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">{t.admin.noDataYet}</span>
              )}
            </AdminDashboardCard>
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminActivitySection activity={data?.recentActivity} loading={loading} />
            <AdminExecutionErrors
              errors={data?.executionErrors}
              loading={loading}
              available={adminStatsAvailable}
            />
            <AdminErrorMonitoring
              errors={data?.errorMonitoring}
              loading={loading}
              diagnosticsAvailable={Boolean(data?.diagnosticsAvailable)}
            />
          </div>
        </AdminDashboardErrorBoundary>
      </section>
    </div>
  );
}

function emptyBackendData(): AdminDashboardBackendData {
  return {
    health: null,
    totalModels: null,
    enabledModels: null,
    models: null,
    providerHealth: null,
    comparisons: null,
    deployment: null,
    providerErrors: null,
    adminStats: null,
    diagnosticsAvailable: false,
  };
}

function emptyDashboardPayload(): AdminDashboardPayload {
  return {
    ...emptyBackendData(),
    systemOverview: {
      applicationVersion: null,
      gitCommit: null,
      lastDeploymentTime: null,
      environment: null,
      apiBaseUrl: null,
      refreshedAt: null,
    },
    providerStatuses: [],
    modelStats: null,
    recentActivity: [],
    errorMonitoring: [],
    executionErrors: [],
  };
}

function normalizeDashboardPayload(data: AdminDashboardPayload | undefined): AdminDashboardPayload {
  if (!data || typeof data !== "object") return emptyDashboardPayload();

  return {
    health: data.health ?? null,
    totalModels: typeof data.totalModels === "number" ? data.totalModels : null,
    enabledModels: typeof data.enabledModels === "number" ? data.enabledModels : null,
    models: Array.isArray(data.models) ? data.models : null,
    providerHealth: Array.isArray(data.providerHealth) ? data.providerHealth : null,
    comparisons: data.comparisons ?? null,
    deployment: data.deployment ?? null,
    providerErrors: Array.isArray(data.providerErrors) ? data.providerErrors : null,
    adminStats: data.adminStats ?? null,
    diagnosticsAvailable: Boolean(data.diagnosticsAvailable),
    systemOverview: {
      applicationVersion: data.systemOverview?.applicationVersion ?? null,
      gitCommit: data.systemOverview?.gitCommit ?? null,
      lastDeploymentTime: data.systemOverview?.lastDeploymentTime ?? null,
      environment: data.systemOverview?.environment ?? null,
      apiBaseUrl: data.systemOverview?.apiBaseUrl ?? null,
      refreshedAt: data.systemOverview?.refreshedAt ?? null,
    },
    providerStatuses: Array.isArray(data.providerStatuses) ? data.providerStatuses : [],
    modelStats: data.modelStats ?? null,
    recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
    errorMonitoring: Array.isArray(data.errorMonitoring) ? data.errorMonitoring : [],
    executionErrors: Array.isArray(data.executionErrors) ? data.executionErrors : [],
  };
}
