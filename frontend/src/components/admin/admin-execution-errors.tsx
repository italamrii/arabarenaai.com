"use client";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { useTranslations } from "@/i18n/locale-context";
import type { ExecutionErrorItem } from "@/lib/admin/errors";

interface AdminExecutionErrorsProps {
  errors: ExecutionErrorItem[] | null | undefined;
  loading: boolean;
  available: boolean;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString("ar-SA", { hour12: false });
}

export function AdminExecutionErrors({ errors, loading, available }: AdminExecutionErrorsProps) {
  const t = useTranslations();
  const items = Array.isArray(errors) ? errors : [];

  return (
    <AdminDashboardCard
      title={t.admin.executionErrors.title}
      loading={loading}
      skeletonLines={5}
      className="sm:col-span-2 lg:col-span-3"
    >
      {!available ? (
        <p className="text-sm text-muted-foreground">{t.admin.executionErrors.unavailable}</p>
      ) : items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pe-4 text-start font-medium">
                  {t.admin.executionErrors.timestamp}
                </th>
                <th className="py-2 pe-4 text-start font-medium">
                  {t.admin.executionErrors.provider}
                </th>
                <th className="py-2 pe-4 text-start font-medium">
                  {t.admin.executionErrors.model}
                </th>
                <th className="py-2 pe-4 text-start font-medium">
                  {t.admin.executionErrors.message}
                </th>
                <th className="py-2 pe-4 text-start font-medium">
                  {t.admin.executionErrors.errorCode}
                </th>
                <th className="py-2 text-start font-medium">
                  {t.admin.executionErrors.requestId}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.timestamp}-${index}`} className="border-b border-border/50">
                  <td className="py-2 pe-4 whitespace-nowrap">{formatTimestamp(item.timestamp)}</td>
                  <td className="py-2 pe-4">{item.provider ?? "—"}</td>
                  <td className="py-2 pe-4">{item.model ?? "—"}</td>
                  <td className="py-2 pe-4 text-muted-foreground max-w-[200px] truncate">
                    {item.messageAr ?? "—"}
                  </td>
                  <td className="py-2 pe-4 font-mono text-xs" dir="ltr">
                    {item.errorCode ?? "—"}
                  </td>
                  <td className="py-2 font-mono text-xs truncate max-w-[120px]" dir="ltr">
                    {item.requestId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t.admin.executionErrors.empty}</p>
      )}
    </AdminDashboardCard>
  );
}
