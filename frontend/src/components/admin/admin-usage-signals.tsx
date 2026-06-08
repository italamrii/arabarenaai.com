"use client";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { useTranslations } from "@/i18n/locale-context";
import type { AdminUsageSignals } from "@/lib/admin/admin-stats";

interface AdminUsageSignalsSectionProps {
  signals: AdminUsageSignals | null | undefined;
  loading: boolean;
  available: boolean;
}

export function AdminUsageSignalsSection({
  signals,
  loading,
  available,
}: AdminUsageSignalsSectionProps) {
  const t = useTranslations();
  const NA = t.admin.notAvailable;

  function formatValue(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return NA;
    return String(value);
  }

  if (!available || !signals) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminDashboardCard title={t.admin.usage.onlineNow} loading={loading}>
          <span className="text-sm text-muted-foreground">{NA}</span>
        </AdminDashboardCard>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AdminDashboardCard title={t.admin.usage.onlineNow} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">{formatValue(signals.online_now_5m)}</p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.activeSessions15m} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(signals.active_sessions_15m)}
        </p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.visitorsToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">{formatValue(signals.visitors_today)}</p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.comparisonsToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(signals.comparisons_today)}
        </p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.votesToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">{formatValue(signals.votes_today)}</p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.uploadsToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">{formatValue(signals.uploads_today)}</p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.attachmentsToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(signals.attachments_today)}
        </p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.modelResponsesToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(signals.model_responses_today)}
        </p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.inputTokensToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(signals.total_input_tokens_today)}
        </p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.outputTokensToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(signals.total_output_tokens_today)}
        </p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.avgResponseTimeToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">
          {signals.average_response_time_today != null
            ? `${signals.average_response_time_today} ms`
            : NA}
        </p>
      </AdminDashboardCard>

      <AdminDashboardCard title={t.admin.usage.failedComparisonsToday} loading={loading}>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(signals.failed_comparisons_today)}
        </p>
      </AdminDashboardCard>

      <AdminDashboardCard
        title={t.admin.usage.mostUsedModelsToday}
        loading={loading}
        skeletonLines={5}
        className="sm:col-span-2"
      >
        {signals.most_used_models_today?.length ? (
          <ul className="space-y-1 text-sm">
            {signals.most_used_models_today.map((item) => (
              <li key={item.model_id} className="flex justify-between gap-2">
                <span>{item.model_name_ar}</span>
                <span className="text-muted-foreground tabular-nums">{item.selection_count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-muted-foreground">{t.admin.noDataYet}</span>
        )}
      </AdminDashboardCard>

      <AdminDashboardCard
        title={t.admin.usage.mostUsedProvidersToday}
        loading={loading}
        skeletonLines={5}
        className="sm:col-span-2"
      >
        {signals.most_used_providers_today?.length ? (
          <ul className="space-y-1 text-sm">
            {signals.most_used_providers_today.map((item) => (
              <li key={item.provider_key} className="flex justify-between gap-2">
                <span>{item.provider_name_ar}</span>
                <span className="text-muted-foreground tabular-nums">{item.usage_count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-muted-foreground">{t.admin.noDataYet}</span>
        )}
      </AdminDashboardCard>
    </div>
  );
}
