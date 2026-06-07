"use client";

import type { PreferenceItem } from "@/lib/api/types";
import { formatPercent } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ar } from "@/i18n/ar";

interface PreferenceCardsProps {
  items: PreferenceItem[];
}

export function PreferenceCards({ items }: PreferenceCardsProps) {
  const sorted = [...items].sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"));

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">{ar.insights.noData}</CardContent>
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
                <p className="font-medium">{item.name_ar}</p>
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
