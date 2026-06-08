"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/i18n/locale-context";

interface MaintenanceState {
  enabled: boolean;
  message_ar: string;
  message_en: string;
  estimated_return: string;
}

export function AdminSystemControls() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<MaintenanceState>({
    enabled: false,
    message_ar: t.maintenance.defaultMessage,
    message_en: t.maintenance.defaultMessageEn,
    estimated_return: t.maintenance.defaultReturn,
  });

  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/maintenance", { cache: "no-store" });
      if (!response.ok) {
        setError(t.admin.systemControls.loadFailed);
        return;
      }
      const json = (await response.json()) as { data?: MaintenanceState };
      if (json.data) {
        setState(json.data);
      }
    } catch {
      setError(t.admin.systemControls.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  async function saveMaintenance(nextEnabled: boolean) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, enabled: nextEnabled }),
      });
      if (!response.ok) {
        setError(t.admin.systemControls.saveFailed);
        return;
      }
      const json = (await response.json()) as { data?: MaintenanceState };
      if (json.data) {
        setState(json.data);
      }
    } catch {
      setError(t.admin.systemControls.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminDashboardCard title={t.admin.systemControls.title} loading={loading} skeletonLines={3}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{t.admin.systemControls.maintenanceMode}</p>
            <p className="text-xs text-muted-foreground">{t.admin.systemControls.maintenanceHint}</p>
          </div>
          <Switch
            checked={state.enabled}
            disabled={saving || loading}
            onCheckedChange={(checked) => void saveMaintenance(checked)}
            aria-label={t.admin.systemControls.maintenanceMode}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t.admin.systemControls.status}:{" "}
          <span className="font-medium text-foreground">
            {state.enabled ? t.admin.systemControls.on : t.admin.systemControls.off}
          </span>
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button variant="outline" size="sm" onClick={() => void loadState()} disabled={loading || saving}>
          {t.admin.refresh}
        </Button>
      </div>
    </AdminDashboardCard>
  );
}
