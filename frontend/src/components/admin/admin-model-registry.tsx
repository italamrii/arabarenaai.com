"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale, useTranslations } from "@/i18n/locale-context";
import { localizedName } from "@/lib/i18n/display";

interface RegistryProvider {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  enabled: boolean;
}

interface RegistryModel {
  id: string;
  key: string;
  name_ar: string;
  name_en: string | null;
  provider_id: string;
  provider_key: string;
  provider_name_ar: string;
  is_enabled: boolean;
  is_placeholder: boolean;
  is_archived: boolean;
  supports_attachments: boolean;
  sort_order: number;
  max_tokens: number;
  timeout_ms: number;
  adapter_configured: boolean;
}

interface ModelFormState {
  key: string;
  name_ar: string;
  name_en: string;
  provider_key: string;
  is_enabled: boolean;
  is_placeholder: boolean;
  supports_attachments: boolean;
  sort_order: number;
  max_tokens: number;
  timeout_ms: number;
}

const EMPTY_FORM: ModelFormState = {
  key: "",
  name_ar: "",
  name_en: "",
  provider_key: "",
  is_enabled: true,
  is_placeholder: false,
  supports_attachments: false,
  sort_order: 0,
  max_tokens: 4096,
  timeout_ms: 30000,
};

export function AdminModelRegistry() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [models, setModels] = useState<RegistryModel[]>([]);
  const [providers, setProviders] = useState<RegistryProvider[]>([]);
  const [providerFilter, setProviderFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ModelFormState>(EMPTY_FORM);
  const [testResult, setTestResult] = useState<{
    modelId: string;
    success: boolean;
    message: string;
    preview?: string;
    responseTimeMs?: number;
  } | null>(null);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = providerFilter ? `?provider=${encodeURIComponent(providerFilter)}` : "";
      const response = await fetch(`/api/admin/model-registry${query}`, { cache: "no-store" });
      if (!response.ok) {
        setError(t.admin.modelRegistry.loadFailed);
        return;
      }
      const json = (await response.json()) as {
        data?: { models?: RegistryModel[]; providers?: RegistryProvider[] };
      };
      setModels(json.data?.models ?? []);
      setProviders(json.data?.providers ?? []);
    } catch {
      setError(t.admin.modelRegistry.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [providerFilter, t]);

  useEffect(() => {
    void loadRegistry();
  }, [loadRegistry]);

  const filteredModels = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return models;
    return models.filter((model) => {
      const haystack = [
        model.key,
        model.name_ar,
        model.name_en ?? "",
        model.provider_key,
        model.provider_name_ar,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [models, search]);

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      provider_key: providers[0]?.key ?? "",
      sort_order: models.length,
    });
    setFormOpen(true);
    setSuccess(null);
    setError(null);
  }

  function openEditForm(model: RegistryModel) {
    setEditingId(model.id);
    setForm({
      key: model.key,
      name_ar: model.name_ar,
      name_en: model.name_en ?? "",
      provider_key: model.provider_key,
      is_enabled: model.is_enabled,
      is_placeholder: model.is_placeholder,
      supports_attachments: model.supports_attachments,
      sort_order: model.sort_order,
      max_tokens: model.max_tokens,
      timeout_ms: model.timeout_ms,
    });
    setFormOpen(true);
    setSuccess(null);
    setError(null);
  }

  async function saveForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        key: form.key.trim(),
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim() || null,
        provider_key: form.provider_key,
        is_enabled: form.is_enabled,
        is_placeholder: form.is_placeholder,
        supports_attachments: form.supports_attachments,
        sort_order: form.sort_order,
        max_tokens: form.max_tokens,
        timeout_ms: form.timeout_ms,
      };

      const response = editingId
        ? await fetch(`/api/admin/model-registry/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/model-registry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as {
          error?: { message?: string; message_en?: string };
        } | null;
        const message =
          locale === "ar"
            ? json?.error?.message ?? t.admin.modelRegistry.saveFailed
            : json?.error?.message_en ?? t.admin.modelRegistry.saveFailed;
        setError(message);
        return;
      }

      setSuccess(
        editingId ? t.admin.modelRegistry.updatedSuccess : t.admin.modelRegistry.createdSuccess,
      );
      setFormOpen(false);
      setEditingId(null);
      await loadRegistry();
    } catch {
      setError(t.admin.modelRegistry.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function archiveModel(model: RegistryModel) {
    if (!window.confirm(t.admin.modelRegistry.archiveConfirm)) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/model-registry/${model.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true, is_enabled: false }),
      });
      if (!response.ok) {
        setError(t.admin.modelRegistry.saveFailed);
        return;
      }
      setSuccess(t.admin.modelRegistry.archivedSuccess);
      await loadRegistry();
    } catch {
      setError(t.admin.modelRegistry.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function testModel(model: RegistryModel) {
    setTestingId(model.id);
    setTestResult(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/model-registry/${model.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const json = (await response.json()) as {
        data?: {
          success: boolean;
          response_preview?: string;
          response_time_ms?: number;
          error_message?: string;
          error_message_en?: string;
        };
      };
      const data = json.data;
      if (!data) {
        setError(t.admin.modelRegistry.testFailed);
        return;
      }
      const message = data.success
        ? t.admin.modelRegistry.testSuccess
        : locale === "ar"
          ? (data.error_message ?? t.admin.modelRegistry.testFailed)
          : (data.error_message_en ?? t.admin.modelRegistry.testFailed);
      setTestResult({
        modelId: model.id,
        success: data.success,
        message,
        preview: data.response_preview,
        responseTimeMs: data.response_time_ms,
      });
    } catch {
      setError(t.admin.modelRegistry.testFailed);
    } finally {
      setTestingId(null);
    }
  }

  function statusBadge(model: RegistryModel) {
    if (model.is_archived) {
      return <Badge variant="disabled">{t.admin.modelRegistry.archived}</Badge>;
    }
    if (model.is_placeholder) {
      return <Badge variant="secondary">{t.admin.modelRegistry.placeholder}</Badge>;
    }
    if (model.is_enabled) {
      return (
        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          {t.admin.modelRegistry.enabled}
        </Badge>
      );
    }
    return (
      <Badge className="border-red-500/30 bg-red-500/10 text-red-400">
        {t.admin.modelRegistry.disabled}
      </Badge>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t.admin.modelRegistry.hint}</p>
        <Button onClick={openCreateForm} disabled={loading || providers.length === 0}>
          {t.admin.modelRegistry.addModel}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.admin.modelRegistry.searchPlaceholder}
          className="sm:max-w-xs"
        />
        <select
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
          className="h-10 rounded-lg border border-border bg-muted/50 px-3 text-sm text-foreground sm:max-w-xs"
        >
          <option value="">{t.admin.modelRegistry.allProviders}</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.key}>
              {localizedName(provider, locale)} ({provider.key})
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

      {formOpen ? (
        <AdminDashboardCard
          title={editingId ? t.admin.modelRegistry.editModel : t.admin.modelRegistry.addModel}
          loading={false}
          className="border-accent/30"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>{t.admin.modelRegistry.fields.key}</span>
              <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            </label>
            <label className="space-y-1 text-sm">
              <span>{t.admin.modelRegistry.fields.provider}</span>
              <select
                value={form.provider_key}
                onChange={(e) => setForm({ ...form, provider_key: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-muted/50 px-3 text-sm"
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.key}>
                    {localizedName(provider, locale)} ({provider.key})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>{t.admin.modelRegistry.fields.nameAr}</span>
              <Input
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>{t.admin.modelRegistry.fields.nameEn}</span>
              <Input
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>{t.admin.modelRegistry.fields.sortOrder}</span>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>{t.admin.modelRegistry.fields.maxTokens}</span>
              <Input
                type="number"
                value={form.max_tokens}
                onChange={(e) => setForm({ ...form, max_tokens: Number(e.target.value) })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>{t.admin.modelRegistry.fields.timeoutMs}</span>
              <Input
                type="number"
                value={form.timeout_ms}
                onChange={(e) => setForm({ ...form, timeout_ms: Number(e.target.value) })}
              />
            </label>
            <div className="flex flex-wrap items-center gap-4 text-sm sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_enabled}
                  onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                />
                {t.admin.modelRegistry.fields.enabled}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_placeholder}
                  onChange={(e) => setForm({ ...form, is_placeholder: e.target.checked })}
                />
                {t.admin.modelRegistry.fields.placeholder}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.supports_attachments}
                  onChange={(e) =>
                    setForm({ ...form, supports_attachments: e.target.checked })
                  }
                />
                {t.admin.modelRegistry.fields.attachments}
              </label>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void saveForm()} disabled={saving}>
              {saving ? "..." : t.admin.modelRegistry.save}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                setEditingId(null);
              }}
            >
              {t.admin.modelRegistry.cancel}
            </Button>
          </div>
        </AdminDashboardCard>
      ) : null}

      <AdminDashboardCard title={t.admin.modelRegistry.tableTitle} loading={loading} skeletonLines={8}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pe-3 text-start font-medium">{t.admin.modelRegistry.columns.name}</th>
                <th className="py-2 pe-3 text-start font-medium">{t.admin.modelRegistry.columns.key}</th>
                <th className="py-2 pe-3 text-start font-medium">{t.admin.modelRegistry.columns.provider}</th>
                <th className="py-2 pe-3 text-start font-medium">{t.admin.modelRegistry.columns.status}</th>
                <th className="py-2 pe-3 text-start font-medium">{t.admin.modelRegistry.columns.order}</th>
                <th className="py-2 pe-3 text-start font-medium">{t.admin.modelRegistry.columns.tokens}</th>
                <th className="py-2 text-start font-medium">{t.admin.modelRegistry.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.length ? (
                filteredModels.map((model) => (
                  <tr key={model.id} className="border-b border-border/50 align-top">
                    <td className="py-2 pe-3">
                      <div className="font-medium">{localizedName(model, locale)}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.supports_attachments
                          ? t.admin.modelRegistry.attachmentsYes
                          : t.admin.modelRegistry.attachmentsNo}
                        {!model.adapter_configured ? ` · ${t.admin.modelRegistry.adapterMissing}` : ""}
                      </div>
                    </td>
                    <td className="py-2 pe-3 font-mono text-xs">{model.key}</td>
                    <td className="py-2 pe-3">{model.provider_key}</td>
                    <td className="py-2 pe-3">{statusBadge(model)}</td>
                    <td className="py-2 pe-3 tabular-nums">{model.sort_order}</td>
                    <td className="py-2 pe-3 tabular-nums">
                      {model.max_tokens}
                      <span className="text-muted-foreground"> / {model.timeout_ms}ms</span>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="secondary" onClick={() => openEditForm(model)}>
                          {t.admin.modelRegistry.edit}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={testingId === model.id || model.is_archived}
                          onClick={() => void testModel(model)}
                        >
                          {testingId === model.id ? "..." : t.admin.modelRegistry.test}
                        </Button>
                        {!model.is_archived ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={saving}
                            onClick={() => void archiveModel(model)}
                          >
                            {t.admin.modelRegistry.archive}
                          </Button>
                        ) : null}
                      </div>
                      {testResult?.modelId === model.id ? (
                        <p
                          className={`mt-2 text-xs ${testResult.success ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {testResult.message}
                          {testResult.preview ? ` — ${testResult.preview}` : ""}
                          {testResult.responseTimeMs != null
                            ? ` (${testResult.responseTimeMs} ms)`
                            : ""}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-muted-foreground">
                    {t.admin.noDataYet}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminDashboardCard>
    </div>
  );
}
