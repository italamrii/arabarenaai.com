"use client";

import { useTranslations } from "@/i18n/locale-context";

export function SkipToContent() {
  const t = useTranslations();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground start-4"
    >
      {t.common.skipToContent}
    </a>
  );
}
