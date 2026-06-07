"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ar } from "@/i18n/ar";
import type { AdminDashboardBackendData } from "@/lib/admin/backend";

interface DashboardResponse {
  data: AdminDashboardBackendData;
  spendingLimits: null;
}

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
  const [payload, setPayload] = useState<DashboardResponse | null>(null);
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
        setPayload({ data: emptyDashboardData(), spendingLimits: null });
        return;
      }

      let json: DashboardResponse;
      try {
        json = (await response.json()) as DashboardResponse;
      } catch {
        json = { data: emptyDashboardData(), spendingLimits: null };
      }

      setPayload({
        data: normalizeDashboardData(json.data),
        spendingLimits: null,
      });
    } catch {
      setPayload({ data: emptyDashboardData(), spendingLimits: null });
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

  const data = payload?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{ar.admin.title}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void loadData()} disabled={loading}>
            {ar.admin.refresh}
          </Button>
          <Button variant="outline" onClick={() => void handleLogout()}>
            {ar.admin.logout}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard title={ar.admin.cards.totalModels} loading={loading}>
          {formatValue(data?.totalModels ?? null)}
        </DashboardCard>

        <DashboardCard title={ar.admin.cards.enabledModels} loading={loading}>
          {formatValue(data?.enabledModels ?? null)}
        </DashboardCard>

        <DashboardCard title={ar.admin.cards.providerHealth} loading={loading}>
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
        </DashboardCard>

        <DashboardCard title={ar.admin.cards.recentComparisons} loading={loading}>
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
        </DashboardCard>

        <DashboardCard title={ar.admin.cards.spendingLimits} loading={loading}>
          {COMING_SOON}
        </DashboardCard>

        <DashboardCard title={ar.admin.cards.deploymentStatus} loading={loading}>
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
        </DashboardCard>

        <DashboardCard title={ar.admin.cards.providerErrors} loading={loading} className="sm:col-span-2 lg:col-span-3">
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
        </DashboardCard>
      </div>
    </div>
  );
}

function emptyDashboardData(): AdminDashboardBackendData {
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

function normalizeDashboardData(data: AdminDashboardBackendData | undefined): AdminDashboardBackendData {
  if (!data || typeof data !== "object") return emptyDashboardData();

  return {
    health: data.health ?? null,
    totalModels: typeof data.totalModels === "number" ? data.totalModels : null,
    enabledModels: typeof data.enabledModels === "number" ? data.enabledModels : null,
    providerHealth: Array.isArray(data.providerHealth) ? data.providerHealth : null,
    comparisons: data.comparisons ?? null,
    deployment: data.deployment ?? null,
    providerErrors: Array.isArray(data.providerErrors) ? data.providerErrors : null,
    diagnosticsAvailable: Boolean(data.diagnosticsAvailable),
  };
}

function DashboardCard({
  title,
  children,
  loading,
  className,
}: {
  title: string;
  children: React.ReactNode;
  loading: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <div>{children}</div>}
      </CardContent>
    </Card>
  );
}
