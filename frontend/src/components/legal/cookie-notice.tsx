"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-context";

const STORAGE_KEY = "arabarenaai_cookie_notice_dismissed";

function analyticsEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim(),
  );
}

export function CookieNotice() {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!analyticsEnabled()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label={t.legal.cookieNotice.ariaLabel}
      className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.legal.cookieNotice.message}{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            {t.legal.cookieNotice.learnMore}
          </Link>
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={dismiss} className="shrink-0">
          {t.legal.cookieNotice.accept}
        </Button>
      </div>
    </div>
  );
}
