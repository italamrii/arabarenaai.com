"use client";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/i18n/locale-context";
import type { AdminCostTracking } from "@/lib/admin/admin-stats";

interface AdminCostTrackingSectionProps {
  cost: AdminCostTracking | null | undefined;
  loading: boolean;
  available: boolean;
  compact?: boolean;
}

export function AdminCostTrackingSection({
  cost,
  loading,
  available,
  compact = false,
}: AdminCostTrackingSectionProps) {
  const t = useTranslations();
  const NA = t.admin.notAvailable;

  function formatTokens(value: number | null | undefined): string {
    if (value === null || value === undefined) return NA;
    return value.toLocaleString();
  }

  function formatUsd(value: number | null | undefined): string {
    if (value === null || value === undefined) return NA;
    if (value > 0 && value < 0.01) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(2)}`;
  }

  if (!available || !cost) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminDashboardCard title={t.admin.cost.costToday} loading={loading}>
          <span className="text-sm text-muted-foreground">{NA}</span>
        </AdminDashboardCard>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Badge variant="secondary">{t.admin.cost.estimated}</Badge>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminDashboardCard title={t.admin.cost.costToday} loading={loading}>
            <p className="text-2xl font-semibold tabular-nums">
              {formatUsd(cost.estimated_cost_today_usd)}
            </p>
          </AdminDashboardCard>
          <AdminDashboardCard title={t.admin.cost.costMonth} loading={loading}>
            <p className="text-2xl font-semibold tabular-nums">
              {formatUsd(cost.estimated_cost_month_usd)}
            </p>
          </AdminDashboardCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Badge variant="secondary">{t.admin.cost.estimated}</Badge>
        <span>{t.admin.cost.estimatedNote}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminDashboardCard title={t.admin.cost.costToday} loading={loading}>
          <p className="text-2xl font-semibold tabular-nums">
            {formatUsd(cost.estimated_cost_today_usd)}
          </p>
        </AdminDashboardCard>

        <AdminDashboardCard title={t.admin.cost.costMonth} loading={loading}>
          <p className="text-2xl font-semibold tabular-nums">
            {formatUsd(cost.estimated_cost_month_usd)}
          </p>
        </AdminDashboardCard>

        <AdminDashboardCard title={t.admin.cost.inputTokensToday} loading={loading}>
          <p className="text-2xl font-semibold tabular-nums">
            {formatTokens(cost.input_tokens_today)}
          </p>
        </AdminDashboardCard>

        <AdminDashboardCard title={t.admin.cost.outputTokensToday} loading={loading}>
          <p className="text-2xl font-semibold tabular-nums">
            {formatTokens(cost.output_tokens_today)}
          </p>
        </AdminDashboardCard>

        <AdminDashboardCard title={t.admin.cost.avgCostPerComparison} loading={loading}>
          <p className="text-2xl font-semibold tabular-nums">
            {formatUsd(cost.average_cost_per_comparison_today)}
          </p>
        </AdminDashboardCard>

        <AdminDashboardCard title={t.admin.cost.mostExpensiveProviderToday} loading={loading}>
          {cost.most_expensive_provider_today ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">{cost.most_expensive_provider_today.provider_name_ar}</p>
              <p className="text-muted-foreground tabular-nums">
                {formatUsd(cost.most_expensive_provider_today.estimated_cost_usd)}
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t.admin.noDataYet}</span>
          )}
        </AdminDashboardCard>

        <AdminDashboardCard title={t.admin.cost.mostExpensiveModelToday} loading={loading}>
          {cost.most_expensive_model_today ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium">{cost.most_expensive_model_today.model_name_ar}</p>
              <p className="text-muted-foreground tabular-nums">
                {formatUsd(cost.most_expensive_model_today.estimated_cost_usd)}
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t.admin.noDataYet}</span>
          )}
        </AdminDashboardCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminDashboardCard
          title={t.admin.cost.costByProvider}
          loading={loading}
          skeletonLines={6}
          className="lg:col-span-1"
        >
          {cost.cost_by_provider_today?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pe-4 text-start font-medium">{t.admin.providerStatus.title}</th>
                    <th className="py-2 pe-4 text-start font-medium">{t.admin.cost.inputTokensToday}</th>
                    <th className="py-2 pe-4 text-start font-medium">{t.admin.cost.outputTokensToday}</th>
                    <th className="py-2 text-start font-medium">{t.admin.cost.costToday}</th>
                  </tr>
                </thead>
                <tbody>
                  {cost.cost_by_provider_today.map((item) => (
                    <tr key={item.provider_key} className="border-b border-border/50">
                      <td className="py-2 pe-4">{item.provider_name_ar}</td>
                      <td className="py-2 pe-4 tabular-nums">{formatTokens(item.input_tokens)}</td>
                      <td className="py-2 pe-4 tabular-nums">{formatTokens(item.output_tokens)}</td>
                      <td className="py-2 tabular-nums">{formatUsd(item.estimated_cost_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t.admin.noDataYet}</span>
          )}
        </AdminDashboardCard>

        <AdminDashboardCard
          title={t.admin.cost.costByModel}
          loading={loading}
          skeletonLines={6}
          className="lg:col-span-1"
        >
          {cost.cost_by_model_today?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 pe-4 text-start font-medium">{t.admin.cost.modelColumn}</th>
                    <th className="py-2 pe-4 text-start font-medium">{t.admin.cost.inputTokensToday}</th>
                    <th className="py-2 pe-4 text-start font-medium">{t.admin.cost.outputTokensToday}</th>
                    <th className="py-2 text-start font-medium">{t.admin.cost.costToday}</th>
                  </tr>
                </thead>
                <tbody>
                  {cost.cost_by_model_today.map((item) => (
                    <tr key={item.model_key} className="border-b border-border/50">
                      <td className="py-2 pe-4">{item.model_name_ar}</td>
                      <td className="py-2 pe-4 tabular-nums">{formatTokens(item.input_tokens)}</td>
                      <td className="py-2 pe-4 tabular-nums">{formatTokens(item.output_tokens)}</td>
                      <td className="py-2 tabular-nums">{formatUsd(item.estimated_cost_usd)}</td>
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

      <AdminDashboardCard title={t.admin.cost.missingPricingModels} loading={loading} skeletonLines={4}>
        {cost.missing_pricing_models?.length ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {cost.missing_pricing_models.map((item) => (
              <li key={item.model_key} className="flex justify-between gap-2">
                <span>{item.model_name_ar}</span>
                <span dir="ltr" className="font-mono text-xs">
                  {item.model_key}
                </span>
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
