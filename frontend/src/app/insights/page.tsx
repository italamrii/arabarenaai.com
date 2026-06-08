"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { PreferenceCards } from "@/components/analytics/preference-cards";
import { DisclaimerBanner } from "@/components/analytics/disclaimer-banner";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { ChartSkeleton, PageSkeleton } from "@/components/shared/loading-skeletons";

const PreferenceChart = dynamic(
  () =>
    import("@/components/analytics/preference-chart").then((module) => ({
      default: module.PreferenceChart,
    })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  },
);
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/use-categories";
import { usePreferences, usePreferencesSummary } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/i18n/locale-context";
import { localizedName } from "@/lib/i18n/display";

export default function InsightsPage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { data: categoriesData } = useCategories();
  const { data: summary, isLoading: loadingSummary } = usePreferencesSummary();
  const { data: categoryPrefs, isLoading: loadingCategory } = usePreferences(activeCategory);

  const displayData = activeCategory ? categoryPrefs : summary?.overall;
  const isLoading = activeCategory ? loadingCategory : loadingSummary;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={t.insights.title} subtitle={t.insights.subtitle} className="mb-8" />

      <ErrorBoundary>
        <div className="space-y-8 animate-fade-in">
          <DisclaimerBanner />

          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">رسم بياني</TabsTrigger>
              <TabsTrigger value="cards">بطاقات</TabsTrigger>
            </TabsList>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                  activeCategory === null
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.insights.overall}
              </button>
              {categoriesData?.categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                    activeCategory === cat.key
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {localizedName(cat, locale)}
                </button>
              ))}
            </div>

            {displayData && (
              <Card className="mt-4">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t.insights.totalVotes}</span>
                  <Badge variant="default">{displayData.total_votes}</Badge>
                </CardContent>
              </Card>
            )}

            <TabsContent value="chart">
              {isLoading ? (
                <ChartSkeleton />
              ) : displayData ? (
                <PreferenceChart
                  data={displayData.preferences}
                  title={
                    activeCategory
                      ? `${t.insights.preferenceShare} — ${displayData.category ? localizedName(displayData.category, locale) : ""}`
                      : t.insights.preferenceShare
                  }
                />
              ) : null}
            </TabsContent>

            <TabsContent value="cards">
              {isLoading ? (
                <PageSkeleton />
              ) : displayData ? (
                <PreferenceCards items={displayData.preferences} />
              ) : null}
            </TabsContent>
          </Tabs>

          {!activeCategory && summary && (
            <section className="space-y-4 pt-8 border-t border-border">
              <h2 className="text-xl font-semibold">{t.insights.byCategory}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {summary.by_category.map((item) => (
                  <Card
                    key={item.category.key}
                    className="cursor-pointer hover:border-accent/30 transition-colors"
                    onClick={() => setActiveCategory(item.category.key)}
                  >
                    <CardContent className="p-4">
                      <p className="font-medium">{localizedName(item.category, locale)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.total_votes} {t.insights.totalVotes.toLowerCase()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </ErrorBoundary>
    </Container>
  );
}
