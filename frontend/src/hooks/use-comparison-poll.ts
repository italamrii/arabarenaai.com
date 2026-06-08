"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

const TERMINAL = new Set(["completed", "partial", "failed"]);
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 5 * 60 * 1000;

export class ComparisonPollTimeoutError extends Error {
  constructor() {
    super("Comparison polling timed out");
    this.name = "ComparisonPollTimeoutError";
  }
}

export function useComparisonPoll(id: string | null) {
  const startedAtRef = useRef<number | null>(null);
  if (id && startedAtRef.current === null) {
    startedAtRef.current = Date.now();
  }
  if (!id) {
    startedAtRef.current = null;
  }

  return useQuery({
    queryKey: ["comparison", id],
    queryFn: async () => {
      const startedAt = startedAtRef.current ?? Date.now();
      if (Date.now() - startedAt > MAX_POLL_DURATION_MS) {
        throw new ComparisonPollTimeoutError();
      }
      return api.getComparison(id!);
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL.has(status)) return false;
      const startedAt = startedAtRef.current ?? Date.now();
      if (Date.now() - startedAt > MAX_POLL_DURATION_MS) return false;
      return POLL_INTERVAL_MS;
    },
    retry: (failureCount, error) => {
      if (error instanceof ComparisonPollTimeoutError) return false;
      return failureCount < 1;
    },
  });
}
