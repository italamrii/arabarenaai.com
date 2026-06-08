"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

import { ComparisonProgress } from "@/components/comparison/comparison-progress";
import { ResponseGrid } from "@/components/comparison/response-card";
import { VotePanel } from "@/components/voting/vote-panel";
import { DisclaimerBanner } from "@/components/analytics/disclaimer-banner";
import { AiContentNotice } from "@/components/legal/ai-content-notice";
import { Container } from "@/components/layout/container";
import { ComparisonSkeleton } from "@/components/shared/loading-skeletons";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComparisonPollTimeoutError, useComparisonPoll } from "@/hooks/use-comparison-poll";
import { useVote } from "@/hooks/use-vote";
import { ApiClientError } from "@/lib/api/client";
import { useLocale, useTranslations } from "@/i18n/locale-context";
import { apiErrorMessage, localizedName } from "@/lib/i18n/display";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const { id } = use(params);
  const { data: comparison, isLoading, error } = useComparisonPoll(id);
  const voteMutation = useVote(id);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const isRunning = comparison?.status === "pending" || comparison?.status === "running";
  const canVote =
    comparison &&
    (comparison.status === "completed" || comparison.status === "partial") &&
    !comparison.vote;

  const hasVoted = !!comparison?.vote || voteSuccess;
  const activeSelectionId = selectedResponseId ?? comparison?.vote?.response_id ?? null;

  const selectedModelName = useMemo(() => {
    if (!comparison || !activeSelectionId) return null;
    const response = comparison.responses.find((r) => r.id === activeSelectionId);
    return response?.model ? localizedName(response.model, locale) : null;
  }, [comparison, activeSelectionId, locale]);

  const handleVote = async () => {
    if (!selectedResponseId) return;
    setVoteError(null);
    try {
      await voteMutation.mutateAsync(selectedResponseId);
      setVoteSuccess(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setVoteError(apiErrorMessage(err, locale));
      }
    }
  };

  if (isLoading) {
    return (
      <Container className="py-10 pb-28">
        <ComparisonSkeleton />
      </Container>
    );
  }

  if (error instanceof ComparisonPollTimeoutError) {
    return (
      <Container className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">{t.results.pollTimeout}</p>
        <p className="text-sm text-muted-foreground">{t.results.pollTimeoutHint}</p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/compare">{t.results.compareAgain}</Link>
        </Button>
      </Container>
    );
  }

  if (error || !comparison) {
    return (
      <Container className="py-16 text-center">
        <p className="text-muted-foreground">{t.errors.generic}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/compare">{t.results.compareAgain}</Link>
        </Button>
      </Container>
    );
  }

  const showStickyVote = canVote && !hasVoted && !!selectedResponseId;

  return (
    <>
      <Container className="py-10 sm:py-12 pb-32">
        <ErrorBoundary>
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {localizedName(comparison.category, locale)}
                </Badge>
                {comparison.status === "partial" && (
                  <Badge variant="outline">{t.results.partial}</Badge>
                )}
              </div>
              <div className="card-premium px-6 py-5">
                <p className="section-label mb-3">{t.compare.promptLabel}</p>
                <p className="text-base sm:text-lg leading-relaxed text-foreground/95 whitespace-pre-wrap" dir="auto">
                  {comparison.prompt.content || (isRunning ? "..." : "")}
                </p>
              </div>
            </header>

            <DisclaimerBanner />
            <AiContentNotice className="mt-2" />

            {isRunning && <ComparisonProgress responses={comparison.responses} isRunning />}

            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">{t.results.responsesHeading}</h2>
                {canVote && !hasVoted && (
                  <p className="text-sm text-muted-foreground mt-1.5">{t.results.responsesHint}</p>
                )}
              </div>

              <ResponseGrid
                responses={comparison.responses}
                selectedResponseId={activeSelectionId}
                votedResponseId={comparison.vote?.response_id}
                canVote={!!canVote && !hasVoted}
                onSelectResponse={setSelectedResponseId}
              />
            </section>

            {canVote && !hasVoted && !showStickyVote && (
              <VotePanel
                hasVoted={false}
                selectedResponseId={selectedResponseId}
                selectedModelName={selectedModelName}
                submitting={voteMutation.isPending}
                onSubmit={handleVote}
              />
            )}

            {hasVoted && (
              <VotePanel
                hasVoted
                selectedResponseId={null}
                submitting={false}
                onSubmit={() => {}}
              />
            )}

            {voteError && (
              <p className="text-sm text-destructive text-center rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                {voteError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button asChild variant="outline">
                <Link href="/compare">
                  <RefreshCw className="h-4 w-4" />
                  {t.results.compareAgain}
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/insights">
                  {t.results.viewInsights}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </ErrorBoundary>
      </Container>

      {showStickyVote && (
        <VotePanel
          hasVoted={false}
          selectedResponseId={selectedResponseId}
          selectedModelName={selectedModelName}
          submitting={voteMutation.isPending}
          onSubmit={handleVote}
          sticky
        />
      )}
    </>
  );
}
