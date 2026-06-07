"use client";

import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ar } from "@/i18n/ar";

interface CompareSubmitBarProps {
  promptLength: number;
  modelCount: number;
  maxModels?: number;
  isReady: boolean;
  statusMessage: string;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function CompareSubmitBar({
  promptLength,
  modelCount,
  maxModels = 10,
  isReady,
  statusMessage,
  isSubmitting,
  onSubmit,
}: CompareSubmitBarProps) {
  return (
    <div className="sticky-cta-bar">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="text-sm font-medium text-foreground truncate">
            {isReady ? ar.compare.readyToCompare : statusMessage}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {modelCount} / {maxModels} {ar.compare.selected}
            {promptLength > 0 && (
              <span className="mx-2 text-border">·</span>
            )}
            {promptLength > 0 && `${promptLength} حرف`}
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
              {ar.compare.submitting}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {ar.compare.submit}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
