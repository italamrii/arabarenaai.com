"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PreferenceItem } from "@/lib/api/types";
import { formatPercent } from "@/lib/utils";
import { ar } from "@/i18n/ar";

interface PreferenceChartProps {
  data: PreferenceItem[];
  title?: string;
}

export function PreferenceChart({ data, title = ar.insights.preferenceShare }: PreferenceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">{ar.insights.noData}</CardContent>
      </Card>
    );
  }

  const chartData = [...data]
    .sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"))
    .map((item) => ({
      name: item.name_ar,
      share: item.preference_share_pct,
      votes: item.vote_count,
    }));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={70}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#111",
                  border: "1px solid #222",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number, _name, props) => [
                  `${formatPercent(value)} (${(props.payload as { votes: number }).votes} صوت)`,
                  ar.insights.preferenceShare,
                ]}
              />
              <Bar dataKey="share" fill="#00D4FF" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
