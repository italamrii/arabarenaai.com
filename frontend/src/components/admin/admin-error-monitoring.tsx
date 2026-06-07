import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { ar } from "@/i18n/ar";
import type { SystemErrorItem } from "@/lib/admin/errors";

interface AdminErrorMonitoringProps {
  errors: SystemErrorItem[] | null | undefined;
  loading: boolean;
  diagnosticsAvailable: boolean;
}

export function AdminErrorMonitoring({
  errors,
  loading,
  diagnosticsAvailable,
}: AdminErrorMonitoringProps) {
  const items = Array.isArray(errors) ? errors : [];

  return (
    <AdminDashboardCard
      title={ar.admin.errorMonitoring.title}
      loading={loading}
      skeletonLines={4}
      className="sm:col-span-2 lg:col-span-3"
    >
      {!diagnosticsAvailable ? (
        <p className="text-sm text-muted-foreground">{ar.admin.errorMonitoring.empty}</p>
      ) : items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pe-4 text-start font-medium">
                  {ar.admin.errorMonitoring.source}
                </th>
                <th className="py-2 pe-4 text-start font-medium">
                  {ar.admin.errorMonitoring.errorType}
                </th>
                <th className="py-2 text-start font-medium">
                  {ar.admin.errorMonitoring.failures}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.source} className="border-b border-border/50">
                  <td className="py-2 pe-4 font-medium">{item.source}</td>
                  <td className="py-2 pe-4 text-muted-foreground">{item.errorType ?? "—"}</td>
                  <td className="py-2">{item.failures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{ar.admin.errorMonitoring.noRecordedErrors}</p>
      )}
    </AdminDashboardCard>
  );
}
