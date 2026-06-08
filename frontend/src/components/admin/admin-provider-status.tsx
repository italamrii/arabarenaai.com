"use client";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { Badge } from "@/components/ui/badge";
import { useLocale, useTranslations } from "@/i18n/locale-context";
import type { ProviderDisplayStatus, ProviderStatusItem } from "@/lib/admin/providers";

interface AdminProviderStatusProps {
  providers: ProviderStatusItem[] | null | undefined;
  loading: boolean;
  providerHealthAvailable: boolean;
}

export function AdminProviderStatus({
  providers,
  loading,
  providerHealthAvailable,
}: AdminProviderStatusProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const items = Array.isArray(providers) ? providers : [];

  function statusLabel(status: ProviderDisplayStatus): string {
    if (status === "Healthy") return t.admin.providerStatus.healthy;
    if (status === "Unavailable") return t.admin.providerStatus.unavailable;
    if (status === "Degraded") return t.admin.providerStatus.degraded;
    return t.admin.providerStatus.unknown;
  }

  function statusVariant(
    status: ProviderDisplayStatus,
  ): "default" | "secondary" | "outline" | "disabled" {
    if (status === "Healthy") return "default";
    if (status === "Degraded") return "secondary";
    if (status === "Unavailable") return "outline";
    return "disabled";
  }

  return (
    <AdminDashboardCard
      title={t.admin.providerStatus.title}
      loading={loading}
      skeletonLines={7}
      className="sm:col-span-2 lg:col-span-3"
    >
      {items.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((provider) => (
            <li
              key={provider.key}
              className="rounded-md border border-border/60 px-3 py-2 text-sm space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{provider.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                    {provider.key}
                  </p>
                </div>
                <Badge variant={statusVariant(provider.status)}>{statusLabel(provider.status)}</Badge>
              </div>
              {provider.latency_ms != null ? (
                <p className="text-xs text-muted-foreground">
                  {t.admin.providerStatus.latency}: {provider.latency_ms} {t.admin.providerStatus.ms}
                </p>
              ) : null}
              {locale === "ar" && provider.message_ar ? (
                <p className="text-xs text-muted-foreground leading-snug">{provider.message_ar}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !providerHealthAvailable ? (
        <p className="text-sm text-muted-foreground">{t.admin.loadFailed}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{t.admin.noDataYet}</p>
      )}
    </AdminDashboardCard>
  );
}
