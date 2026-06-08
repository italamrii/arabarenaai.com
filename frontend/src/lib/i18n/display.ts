import type { ApiClientError } from "@/lib/api/client";
import type { ProviderRef } from "@/lib/api/types";
import type { Locale } from "@/i18n/types";

interface LocalizedName {
  name_ar: string;
  name_en?: string | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  xai: "xAI",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  allam: "ALLaM",
};

export function localizedName(item: LocalizedName, locale: Locale): string {
  if (locale === "en" && item.name_en) return item.name_en;
  return item.name_ar;
}

export function providerDisplayName(provider: ProviderRef, locale: Locale): string {
  if (locale === "en") {
    return PROVIDER_LABELS[provider.key] ?? provider.key;
  }
  return provider.name_ar;
}

export function apiErrorMessage(error: ApiClientError, locale: Locale): string {
  return locale === "en" ? error.message : error.messageAr;
}
