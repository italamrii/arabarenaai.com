"use client";

import { useTranslations } from "@/i18n/locale-context";

export function AdminSectionErrorFallback() {
  const t = useTranslations();
  return <p className="text-sm text-muted-foreground">{t.admin.sectionError}</p>;
}
