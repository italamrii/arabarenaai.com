"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminActivitySection } from "@/components/admin/admin-activity-section";
import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { AdminDashboardErrorBoundary } from "@/components/admin/admin-dashboard-error-boundary";
import { AdminErrorMonitoring } from "@/components/admin/admin-error-monitoring";
import { AdminProviderStatus } from "@/components/admin/admin-provider-status";
import { AdminSystemOverview } from "@/components/admin/admin-system-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ar } from "@/i18n/ar";
import type { AdminDashboardBackendData } from "@/lib/admin/backend";
import type { AdminDashboardApiResponse, AdminDashboardPayload } from "@/lib/admin/types";

const COMING_SOON = ar.admin.cards.comingSoon;

function formatValue(value: number | string | null | undefined, fallback = COMING_SOON) {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeProviderHealth<T extends { key: string }>(
  value: T[] | null | undefined,
): T[] | null {
  return Array.isArray(value) ? value : null;
}

function statusVariant(status: string | undefined): "default" | "secondary" | "outline" | "disabled" {
  if (!status) return "secondary";
  if (status === "ok" || status === "healthy" || status === "up") return "default";
  if (status === "degraded") return "secondary";
  return "outline";
}

export function AdminDashboard() {
  const router = useRouter();
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{ar.admin.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void loadData()} disabled={loading}>
            {ar.admin.refresh}
          </Button>
          <Button variant="outline" onClick={() => void handleLogout()}>
            {ar.admin.logout}
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{ar.admin.systemOverview.title}</h2>
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminSystemOverview overview={data?.systemOverview} loading={loading} />
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{ar.admin.providerStatus.title}</h2>
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminProviderStatus providers={data?.providerStatuses} loading={loading} />
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">الإحصائيات</h2>
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminDashboardCard title={ar.admin.cards.totalModels} loading={loading}>
              {formatValue(data?.totalModels ?? null)}
            </AdminDashboardCard>

            <AdminDashboardCard title={ar.admin.cards.enabledModels} loading={loading}>
              {formatValue(data?.enabledModels ?? null)}
            </AdminDashboardCard>

            <AdminDashboardCard title={ar.admin.cards.providerHealth} loading={loading} skeletonLines={4}>
              {safeProviderHealth(data?.providerHealth) ? (
                <ul className="space-y-2 text-sm">
                  {data!.providerHealth!.map((provider) => (
                    <li key={provider.key} className="flex items-center justify-between gap-2">
                      <span>{provider.name_ar}</span>
                      <Badge variant={statusVariant(provider.status)}>{provider.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                COMING_SOON
              )}
            </AdminDashboardCard>

            <AdminDashboardCard title={ar.admin.cards.recentComparisons} loading={loading} skeletonLines={5}>
              {data?.diagnosticsAvailable && data.comparisons ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>مكتملة: {data.comparisons.completed ?? "—"}</li>
                  <li>جارية: {data.comparisons.active ?? "—"}</li>
                  <li>جزئية: {data.comparisons.partial ?? "—"}</li>
                  <li>فاشلة: {data.comparisons.failed ?? "—"}</li>
                  <li>إجمالي البدء: {data.comparisons.started ?? "—"}</li>
                </ul>
              ) : (
                COMING_SOON
              )}
            </AdminDashboardCard>

            <AdminDashboardCard title={ar.admin.cards.spendingLimits} loading={loading}>
              {COMING_SOON}
            </AdminDashboardCard>

            <AdminDashboardCard title={ar.admin.cards.deploymentStatus} loading={loading} skeletonLines={4}>
              {data?.diagnosticsAvailable && data.deployment ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>الحالة</span>
                    <Badge variant={statusVariant(data.deployment.status)}>
                      {data.deployment.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">الإصدار: {data.deployment.version}</p>
                  {data.deployment.uptime_seconds != null ? (
                    <p className="text-muted-foreground">
                      وقت التشغيل: {Math.floor(data.deployment.uptime_seconds / 60)} د
                    </p>
                  ) : null}
                  {data.deployment.database_status ? (
                    <p className="text-muted-foreground">
                      قاعدة البيانات: {data.deployment.database_status}
                    </p>
                  ) : null}
                </div>
              ) : (
                COMING_SOON
              )}
            </AdminDashboardCard>

            <AdminDashboardCard
              title={ar.admin.cards.providerErrors}
              loading={loading}
              skeletonLines={4}
              className="sm:col-span-2 lg:col-span-3"
            >
              {data?.diagnosticsAvailable && Array.isArray(data.providerErrors) ? (
                <ul className="space-y-2 text-sm">
                  {data.providerErrors
                    .filter((provider) => provider.failures > 0 || provider.last_error_type)
                    .map((provider) => (
                      <li
                        key={provider.key}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-border/50 pb-2 last:border-0 last:pb-0"
                      >
                        <span className="font-medium">{provider.name_ar}</span>
                        <span className="text-muted-foreground">
                          {provider.last_error_type ?? "—"} · {provider.failures} فشل
                        </span>
                      </li>
                    ))}
                  {!data.providerErrors.some(
                    (provider) => provider.failures > 0 || provider.last_error_type,
                  ) ? (
                    <li className="text-muted-foreground">لا توجد أخطاء مسجّلة حالياً</li>
                  ) : null}
                </ul>
              ) : (
                COMING_SOON
              )}
            </AdminDashboardCard>
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminActivitySection activity={data?.recentActivity} loading={loading} />
          </div>
        </AdminDashboardErrorBoundary>
      </section>

      <section className="space-y-4">
        <AdminDashboardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    providerHealth: null,
    comparisons: null,
    deployment: null,
    providerErrors: null,
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
    },
    providerStatuses: [],
    recentActivity: [],
    errorMonitoring: [],
  };
}

function normalizeDashboardPayload(data: AdminDashboardPayload | undefined): AdminDashboardPayload {
  if (!data || typeof data !== "object") return emptyDashboardPayload();

  return {
    health: data.health ?? null,
    totalModels: typeof data.totalModels === "number" ? data.totalModels : null,
    enabledModels: typeof data.enabledModels === "number" ? data.enabledModels : null,
    providerHealth: Array.isArray(data.providerHealth) ? data.providerHealth : null,
    comparisons: data.comparisons ?? null,
    deployment: data.deployment ?? null,
    providerErrors: Array.isArray(data.providerErrors) ? data.providerErrors : null,
    diagnosticsAvailable: Boolean(data.diagnosticsAvailable),
    systemOverview: {
      applicationVersion: data.systemOverview?.applicationVersion ?? null,
      gitCommit: data.systemOverview?.gitCommit ?? null,
      lastDeploymentTime: data.systemOverview?.lastDeploymentTime ?? null,
      environment: data.systemOverview?.environment ?? null,
    },
    providerStatuses: Array.isArray(data.providerStatuses) ? data.providerStatuses : [],
    recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
    errorMonitoring: Array.isArray(data.errorMonitoring) ? data.errorMonitoring : [],
  };
}
