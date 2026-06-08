"use client";

import { CheckCircle2, Heart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-context";

interface VotePanelProps {
  hasVoted: boolean;
  selectedResponseId: string | null;
  selectedModelName?: string | null;
  submitting: boolean;
  onSubmit: () => void;
  sticky?: boolean;
}

export function VotePanel({
  hasVoted,
  selectedResponseId,
  selectedModelName,
  submitting,
  onSubmit,
  sticky = false,
}: VotePanelProps) {
  const t = useTranslations();

  if (hasVoted) {
    return (
      <div className="card-premium flex items-center gap-4 border-accent/30 bg-accent/5 px-6 py-5">
        <CheckCircle2 className="h-6 w-6 text-accent shrink-0" />
        <div>
          <p className="font-medium text-foreground">{t.results.alreadyVoted}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{t.results.voteSuccess}</p>
        </div>
      </div>
    );
  }

  const content = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{t.results.voteTitle}</p>
        <p className="text-sm text-muted-foreground mt-1">{t.results.voteHint}</p>
        {selectedModelName && (
          <p className="text-sm text-accent mt-2 font-medium">
            {t.results.voteSelected}: {selectedModelName}
          </p>
        )}
      </div>
      <Button
        size="hero"
        disabled={!selectedResponseId || submitting}
        onClick={onSubmit}
        className={cn(
          "cta-hero w-full sm:w-auto sm:min-w-[240px] text-accent-foreground shrink-0",
          selectedResponseId && !submitting && "animate-shimmer",
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t.results.voteSubmitting}
          </>
        ) : (
          <>
            <Heart className="h-5 w-5" />
            {selectedResponseId ? t.results.voteSubmit : t.results.voteSelectFirst}
          </>
        )}
      </Button>
    </div>
  );

  if (sticky && selectedResponseId) {
    return (
      <div className="sticky-cta-bar">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">{content}</div>
      </div>
    );
  }

  return <div className="card-premium px-6 py-5">{content}</div>;
}
