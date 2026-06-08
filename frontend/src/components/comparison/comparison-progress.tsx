"use client";

import { Loader2 } from "lucide-react";

import type { ResponseItem } from "@/lib/api/types";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "@/i18n/locale-context";

interface ComparisonProgressProps {
  responses: ResponseItem[];
  isRunning: boolean;
}

export function ComparisonProgress({ responses, isRunning }: ComparisonProgressProps) {
  const t = useTranslations();

  if (!isRunning) return null;

  const total = responses.length;
  const done = responses.filter((r) => r.status === "success" || r.status === "error" || r.status === "timeout").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="card-premium px-5 py-4 space-y-3" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <p className="text-sm font-medium">{t.results.loading}</p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {t.results.loadingProgress
            .replace("{done}", String(done))
            .replace("{total}", String(total))}
        </p>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}
