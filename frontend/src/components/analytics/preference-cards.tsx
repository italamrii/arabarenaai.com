"use client";

import type { PreferenceItem } from "@/lib/api/types";
import { formatPercent } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocale, useTranslations } from "@/i18n/locale-context";
import { localizedName } from "@/lib/i18n/display";

interface PreferenceCardsProps {
  items: PreferenceItem[];
}

export function PreferenceCards({ items }: PreferenceCardsProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const sorted = [...items].sort((a, b) =>
    localizedName(a, locale).localeCompare(localizedName(b, locale), locale === "ar" ? "ar" : "en"),
  );

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">{t.insights.noData}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map((item) => (
        <Card key={item.model_id} className="hover:border-accent/30 transition-colors">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{localizedName(item, locale)}</p>
                <Badge variant="secondary" className="mt-1">
                  {item.provider_key}
                </Badge>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-accent">{formatPercent(item.preference_share_pct)}</p>
                <p className="text-xs text-muted-foreground">{item.vote_count} صوت</p>
              </div>
            </div>
            <Progress value={item.preference_share_pct} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
