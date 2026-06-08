export type ProviderDisplayStatus = "Healthy" | "Unavailable" | "Degraded" | "Unknown";

export interface ProviderStatusItem {
  key: string;
  label: string;
  name_ar?: string | null;
  status: ProviderDisplayStatus;
  rawStatus?: string | null;
  latency_ms?: number | null;
  message_ar?: string | null;
}

export const ADMIN_PROVIDER_CATALOG = [
  { key: "openai", label: "OpenAI" },
  { key: "anthropic", label: "Anthropic" },
  { key: "google", label: "Google" },
  { key: "xai", label: "xAI" },
  { key: "deepseek", label: "DeepSeek" },
  { key: "qwen", label: "Qwen" },
  { key: "allam", label: "ALLaM" },
] as const;

const CATALOG_LABELS: Record<string, string> = Object.fromEntries(
  ADMIN_PROVIDER_CATALOG.map((provider) => [provider.key, provider.label]),
);

export function normalizeProviderStatus(rawStatus: string | undefined | null): ProviderDisplayStatus {
  if (!rawStatus) return "Unknown";

  const status = rawStatus.trim().toLowerCase();
  if (status === "healthy" || status === "ok" || status === "up") return "Healthy";
  if (status === "degraded") return "Degraded";
  if (status === "unavailable" || status === "unhealthy" || status === "down") {
    return "Unavailable";
  }
  return "Unknown";
}

export function buildProviderStatusOverview(
  providerHealth: Array<{
    key: string;
    name_ar?: string;
    status: string;
    latency_ms?: number | null;
    message_ar?: string | null;
  }> | null | undefined,
): ProviderStatusItem[] {
  if (Array.isArray(providerHealth) && providerHealth.length > 0) {
    return providerHealth.map((provider) => ({
      key: provider.key,
      label: CATALOG_LABELS[provider.key] ?? provider.name_ar ?? provider.key,
      name_ar: provider.name_ar ?? null,
      status: normalizeProviderStatus(provider.status),
      rawStatus: provider.status,
      latency_ms: provider.latency_ms ?? null,
      message_ar: provider.message_ar ?? null,
    }));
  }

  return ADMIN_PROVIDER_CATALOG.map((provider) => ({
    key: provider.key,
    label: provider.label,
    status: "Unknown" as const,
    rawStatus: null,
    latency_ms: null,
    message_ar: null,
  }));
}
