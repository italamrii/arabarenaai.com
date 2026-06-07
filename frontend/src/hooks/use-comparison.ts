"use client";

import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { CreateComparisonPayload } from "@/lib/api/types";

export function useCreateComparison() {
  return useMutation({
    mutationFn: (payload: CreateComparisonPayload) => api.createComparison(payload),
  });
}
