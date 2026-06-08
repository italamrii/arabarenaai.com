"use client";

import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import type { ResponseItem } from "@/lib/api/types";
import { cn, formatLatency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useLocale, useTranslations } from "@/i18n/locale-context";
import { localizedName, providerDisplayName } from "@/lib/i18n/display";

interface ResponseCardProps {
  response: ResponseItem;
  index: number;
  selected?: boolean;
  voted?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
}

export function ResponseCard({
  response,
  index,
  selected,
  voted,
  selectable,
  onSelect,
}: ResponseCardProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const isPending = response.status === "pending";
  const isError = response.status === "error" || response.status === "timeout";
  const isSuccess = response.status === "success";
  const modelName = response.model ? localizedName(response.model, locale) : "—";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectable && isSuccess && onSelect && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <article
      role={selectable && isSuccess ? "button" : undefined}
      tabIndex={selectable && isSuccess ? 0 : undefined}
      aria-pressed={selectable && isSuccess ? selected : undefined}
      aria-label={
        selectable && isSuccess
          ? `${modelName} — ${selected ? t.results.selected : t.results.clickToSelect}`
          : undefined
      }
      onClick={() => {
        if (selectable && isSuccess && onSelect) onSelect();
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        "card-premium flex flex-col h-full transition-all duration-300 overflow-hidden",
        selectable && isSuccess && "cursor-pointer hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5",
        selected && "border-accent ring-2 ring-accent/40 glow-accent",
        voted && selected && "border-accent/70",
        !selectable && isSuccess && "opacity-95",
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              selected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{modelName}</p>
            {response.model && (
              <Badge variant="secondary" className="mt-1.5 text-[11px]">
                {providerDisplayName(response.model.provider, locale)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden />}
          {isError && <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />}
          {selected && isSuccess && (
            <CheckCircle2 className="h-5 w-5 text-accent" aria-label={t.results.selected} />
          )}
        </div>
      </header>

      {isSuccess && response.response_time_ms != null && (
        <div className="flex items-center gap-1.5 px-5 py-2 text-xs text-muted-foreground border-b border-border/40 bg-muted/20">
          <Clock className="h-3 w-3" />
          {t.results.responseTime}: {formatLatency(response.response_time_ms)}
        </div>
      )}

      <div className="flex-1 px-5 py-5">
        {isPending && (
          <div className="space-y-3" aria-live="polite">
            <div className="h-3.5 bg-muted/80 rounded-md animate-pulse" />
            <div className="h-3.5 bg-muted/80 rounded-md animate-pulse w-[92%]" />
            <div className="h-3.5 bg-muted/80 rounded-md animate-pulse w-[78%]" />
            <div className="h-3.5 bg-muted/80 rounded-md animate-pulse w-[65%]" />
            <p className="text-xs text-muted-foreground pt-2 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t.results.waiting}
            </p>
          </div>
        )}
        {isError && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {(locale === "ar" && response.error_message_ar) || t.results.errorResponse}
          </p>
        )}
        {isSuccess && (
          <div className="response-prose whitespace-pre-wrap" dir="auto">
            {response.content}
          </div>
        )}
      </div>

      {selectable && isSuccess && selected && (
        <footer className="border-t border-accent/20 bg-accent/5 px-5 py-2.5">
          <p className="text-xs font-medium text-accent">{t.results.voteSelected}</p>
        </footer>
      )}
    </article>
  );
}

interface ResponseGridProps {
  responses: ResponseItem[];
  selectedResponseId?: string | null;
  votedResponseId?: string | null;
  canVote?: boolean;
  onSelectResponse?: (id: string) => void;
}

export function ResponseGrid({
  responses,
  selectedResponseId,
  votedResponseId,
  canVote,
  onSelectResponse,
}: ResponseGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {responses.map((response, index) => (
        <ResponseCard
          key={response.id}
          response={response}
          index={index}
          selected={selectedResponseId === response.id}
          voted={votedResponseId === response.id}
          selectable={canVote && response.status === "success"}
          onSelect={() => onSelectResponse?.(response.id)}
        />
      ))}
    </div>
  );
}
