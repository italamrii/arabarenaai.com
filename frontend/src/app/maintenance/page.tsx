import { Cpu } from "lucide-react";

import { getServerLocale, getServerMessages } from "@/i18n/server";

export default async function MaintenancePage() {
  const t = await getServerMessages();
  const locale = await getServerLocale();

  let maintenance: {
    message_ar: string;
    message_en: string;
    estimated_return: string;
  } = {
    message_ar: t.maintenance.defaultMessage,
    message_en: t.maintenance.defaultMessageEn,
    estimated_return: t.maintenance.defaultReturn,
  };

  try {
    const apiBase =
      process.env.API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      "https://api.arabarenaai.com/v1";
    const normalized = apiBase.replace(/\/+$/, "").endsWith("/v1")
      ? apiBase.replace(/\/+$/, "")
      : `${apiBase.replace(/\/+$/, "")}/v1`;
    const response = await fetch(`${normalized}/platform/status`, { cache: "no-store" });
    if (response.ok) {
      const json = (await response.json()) as {
        data?: {
          maintenance?: {
            message_ar?: string;
            message_en?: string;
            estimated_return?: string;
          };
        };
      };
      if (json.data?.maintenance) {
        maintenance = {
          message_ar: json.data.maintenance.message_ar || maintenance.message_ar,
          message_en: json.data.maintenance.message_en || maintenance.message_en,
          estimated_return:
            json.data.maintenance.estimated_return || maintenance.estimated_return,
        };
      }
    }
  } catch {
    // Use default copy when API is unreachable.
  }

  const message = locale === "en" ? maintenance.message_en : maintenance.message_ar;

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Cpu className="h-8 w-8" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t.maintenance.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{message}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {t.maintenance.estimatedReturn}: {maintenance.estimated_return}
        </p>
        <p className="text-xs text-muted-foreground">ArabArenaAI</p>
      </div>
    </main>
  );
}
