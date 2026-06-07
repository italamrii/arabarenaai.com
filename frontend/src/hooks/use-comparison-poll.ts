"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

const TERMINAL = new Set(["completed", "partial", "failed"]);

export function useComparisonPoll(id: string | null) {
  return useQuery({
    queryKey: ["comparison", id],
    queryFn: () => api.getComparison(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL.has(status)) return false;
      return 2000;
    },
  });
}
