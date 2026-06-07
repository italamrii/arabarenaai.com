"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export function useVote(comparisonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (responseId: string) => api.castVote(comparisonId, responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comparison", comparisonId] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
