"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/i18n/locale-context";
import { localizedName, providerDisplayName } from "@/lib/i18n/display";

interface ProviderControlItem {
  key: string;
  name_ar: string;
  name_en: string | null;
  enabled: boolean;
}

interface ModelControlItem {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  provider_key: string;
  enabled: boolean;
}

export function AdminControlCenter() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderControlItem[]>([]);
  const [models, setModels] = useState<ModelControlItem[]>([]);

  const loadControls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providerRes, modelRes] = await Promise.all([
        fetch("/api/admin/provider-controls", { cache: "no-store" }),
        fetch("/api/admin/model-controls", { cache: "no-store" }),
      ]);

      if (!providerRes.ok || !modelRes.ok) {
        setError(t.admin.controlCenter.loadFailed);
        return;
      }

      const providerJson = (await providerRes.json()) as {
        data?: { providers?: ProviderControlItem[] };
      };
      const modelJson = (await modelRes.json()) as {
        data?: { models?: ModelControlItem[] };
      };

      setProviders(providerJson.data?.providers ?? []);
      setModels(modelJson.data?.models ?? []);
    } catch {
      setError(t.admin.controlCenter.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadControls();
  }, [loadControls]);

  async function toggleProvider(provider: ProviderControlItem) {
    setSavingKey(`provider:${provider.key}`);
    setError(null);
    try {
      const response = await fetch("/api/admin/provider-controls", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_key: provider.key, enabled: !provider.enabled }),
      });
      if (!response.ok) {
        setError(t.admin.controlCenter.saveFailed);
        return;
      }
      const json = (await response.json()) as { data?: ProviderControlItem };
      if (json.data) {
        setProviders((prev) =>
          prev.map((item) => (item.key === json.data!.key ? json.data! : item)),
        );
      }
    } catch {
      setError(t.admin.controlCenter.saveFailed);
    } finally {
      setSavingKey(null);
    }
  }

  async function toggleModel(model: ModelControlItem) {
    setSavingKey(`model:${model.key}`);
    setError(null);
    try {
      const response = await fetch("/api/admin/model-controls", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_key: model.key, enabled: !model.enabled }),
      });
      if (!response.ok) {
        setError(t.admin.controlCenter.saveFailed);
        return;
      }
      const json = (await response.json()) as { data?: ModelControlItem };
      if (json.data) {
        setModels((prev) => prev.map((item) => (item.key === json.data!.key ? json.data! : item)));
      }
    } catch {
      setError(t.admin.controlCenter.saveFailed);
    } finally {
      setSavingKey(null);
    }
  }

  function statusBadge(enabled: boolean) {
    return (
      <Badge
        variant="secondary"
        className={
          enabled
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            : "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400"
        }
      >
        {enabled ? t.admin.controlCenter.enabled : t.admin.controlCenter.disabled}
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        <h3 className="text-base font-semibold mb-3">{t.admin.controlCenter.providerSection}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <AdminDashboardCard
              key={provider.key}
              title={providerDisplayName(
                { key: provider.key, name_ar: provider.name_ar },
                locale,
              )}
              loading={loading}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{t.admin.controlCenter.status}</span>
                  {statusBadge(provider.enabled)}
                </div>
                <Button
                  variant={provider.enabled ? "destructive" : "default"}
                  size="sm"
                  className="w-full"
                  disabled={loading || savingKey === `provider:${provider.key}`}
                  onClick={() => void toggleProvider(provider)}
                >
                  {provider.enabled ? t.admin.controlCenter.disable : t.admin.controlCenter.enable}
                </Button>
              </div>
            </AdminDashboardCard>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3">{t.admin.controlCenter.modelSection}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => {
            const providerRow = providers.find((p) => p.key === model.provider_key);
            return (
            <AdminDashboardCard
              key={model.id}
              title={localizedName(
                { name_ar: model.name_ar, name_en: model.name_en },
                locale,
              )}
              loading={loading}
            >
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {providerRow
                    ? providerDisplayName(
                        { key: providerRow.key, name_ar: providerRow.name_ar },
                        locale,
                      )
                    : model.provider_key}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{t.admin.controlCenter.status}</span>
                  {statusBadge(model.enabled)}
                </div>
                <Button
                  variant={model.enabled ? "destructive" : "default"}
                  size="sm"
                  className="w-full"
                  disabled={loading || savingKey === `model:${model.key}`}
                  onClick={() => void toggleModel(model)}
                >
                  {model.enabled ? t.admin.controlCenter.disable : t.admin.controlCenter.enable}
                </Button>
              </div>
            </AdminDashboardCard>
            );
          })}
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => void loadControls()} disabled={loading}>
        {t.admin.refresh}
      </Button>
    </div>
  );
}
