"use client";

import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale-context";
import type { Locale } from "@/i18n/types";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, messages: t } = useLocale();

  function toggleLocale(): void {
    const next: Locale = locale === "ar" ? "en" : "ar";
    setLocale(next);
  }

  const label = locale === "ar" ? t.localeSwitcher.english : t.localeSwitcher.arabic;

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "sm" : "default"}
      onClick={toggleLocale}
      className={cn("gap-1.5 text-muted-foreground hover:text-foreground", className)}
      aria-label={`${t.localeSwitcher.label}: ${label}`}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </Button>
  );
}
