"use client";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-context";

interface DisclaimerBannerProps {
  message?: string;
  className?: string;
}

export function DisclaimerBanner({ message, className }: DisclaimerBannerProps) {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
      <p>{message ?? t.insights.disclaimer}</p>
    </div>
  );
}
