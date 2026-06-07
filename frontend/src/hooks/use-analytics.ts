"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export function usePreferences(categoryKey?: string | null, period = "all_time") {
  return useQuery({
    queryKey: ["analytics", "preferences", categoryKey ?? "overall", period],
    queryFn: () =>
      api.getPreferences({
        category_key: categoryKey ?? undefined,
        period,
      }),
  });
}

export function usePreferencesSummary(period = "all_time") {
  return useQuery({
    queryKey: ["analytics", "summary", period],
    queryFn: () => api.getPreferencesSummary(period),
  });
}
