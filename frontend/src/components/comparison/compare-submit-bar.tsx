"use client";

import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-context";

interface CompareSubmitBarProps {
  promptLength: number;
  modelCount: number;
  maxModels?: number;
  isReady: boolean;
  statusMessage: string;
  isSubmitting: boolean;
  hasAttachment?: boolean;
  onSubmit: () => void;
}

export function CompareSubmitBar({
  promptLength,
  modelCount,
  maxModels = 10,
  isReady,
  statusMessage,
  isSubmitting,
  hasAttachment = false,
  onSubmit,
}: CompareSubmitBarProps) {
  const t = useTranslations();

  return (
    <div className="sticky-cta-bar">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="text-sm font-medium text-foreground truncate">
            {isReady ? t.compare.readyToCompare : statusMessage}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {modelCount} / {maxModels} {t.compare.selected}
            {promptLength > 0 ? (
              <>
                <span className="mx-2 text-border">·</span>
                {`${promptLength} حرف`}
              </>
            ) : null}
            {hasAttachment ? (
              <>
                <span className="mx-2 text-border">·</span>
                مرفق
              </>
            ) : null}
          </p>
        </div>

        <Button
          type="button"
          size="hero"
          disabled={!isReady || isSubmitting}
          onClick={onSubmit}
          className={cn(
            "cta-hero w-full sm:w-auto sm:min-w-[280px] text-accent-foreground",
            isReady && !isSubmitting && "animate-shimmer",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t.compare.submitting}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {t.compare.submit}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
