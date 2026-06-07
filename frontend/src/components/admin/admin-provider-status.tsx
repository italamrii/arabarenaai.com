import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { Badge } from "@/components/ui/badge";
import { ar } from "@/i18n/ar";
import type { ProviderDisplayStatus, ProviderStatusItem } from "@/lib/admin/providers";

interface AdminProviderStatusProps {
  providers: ProviderStatusItem[] | null | undefined;
  loading: boolean;
}

function statusLabel(status: ProviderDisplayStatus): string {
  if (status === "Healthy") return ar.admin.providerStatus.healthy;
  if (status === "Unavailable") return ar.admin.providerStatus.unavailable;
  return ar.admin.providerStatus.unknown;
}

function statusVariant(
  status: ProviderDisplayStatus,
): "default" | "secondary" | "outline" | "disabled" {
  if (status === "Healthy") return "default";
  if (status === "Unavailable") return "outline";
  return "secondary";
}

export function AdminProviderStatus({ providers, loading }: AdminProviderStatusProps) {
  const items = Array.isArray(providers) ? providers : [];

  return (
    <AdminDashboardCard
      title={ar.admin.providerStatus.title}
      loading={loading}
      skeletonLines={7}
      className="sm:col-span-2 lg:col-span-3"
    >
      {items.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((provider) => (
            <li
              key={provider.key}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
            >
              <span className="font-medium">{provider.label}</span>
              <Badge variant={statusVariant(provider.status)}>{statusLabel(provider.status)}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{ar.admin.cards.comingSoon}</p>
      )}
    </AdminDashboardCard>
  );
}
