"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-context";

interface AiContentNoticeProps {
  className?: string;
}

export function AiContentNotice({ className }: AiContentNoticeProps) {
  const t = useTranslations();

  return (
    <p className={cn("text-xs text-muted-foreground leading-relaxed", className)} role="note">
      {t.legal.aiContentNotice}
    </p>
  );
}
