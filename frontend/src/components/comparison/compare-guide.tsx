"use client";

import { ClipboardList } from "lucide-react";

import { useTranslations } from "@/i18n/locale-context";

export function CompareGuide() {
  const t = useTranslations();

  return (
    <aside
      className="rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5 mb-8 sm:mb-10"
      aria-label={t.compare.guide.title}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <ClipboardList className="h-4 w-4 text-accent" aria-hidden="true" />
        </div>
        <div className="space-y-3 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t.compare.guide.title}</h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {t.compare.guide.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-2">
                <span className="font-medium text-accent tabular-nums">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </aside>
  );
}
