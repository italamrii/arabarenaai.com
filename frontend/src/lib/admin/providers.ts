export type ProviderDisplayStatus = "Healthy" | "Unavailable" | "Unknown";

export interface ProviderStatusItem {
  key: string;
  label: string;
  status: ProviderDisplayStatus;
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

export function normalizeProviderStatus(rawStatus: string | undefined | null): ProviderDisplayStatus {
  if (!rawStatus) return "Unknown";

  const status = rawStatus.trim().toLowerCase();
  if (status === "healthy" || status === "ok" || status === "up") return "Healthy";
  if (status === "unavailable" || status === "degraded" || status === "unhealthy" || status === "down") {
    return "Unavailable";
  }
  return "Unknown";
}

export function buildProviderStatusOverview(
  providerHealth: Array<{ key: string; status: string }> | null | undefined,
): ProviderStatusItem[] {
  const healthMap = new Map<string, string>();

  if (Array.isArray(providerHealth)) {
    for (const provider of providerHealth) {
      if (provider?.key) {
        healthMap.set(provider.key, provider.status);
      }
    }
  }

  return ADMIN_PROVIDER_CATALOG.map((provider) => ({
    key: provider.key,
    label: provider.label,
    status: normalizeProviderStatus(healthMap.get(provider.key)),
  }));
}
