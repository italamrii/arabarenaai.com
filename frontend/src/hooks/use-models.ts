"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export function useModels() {
  return useQuery({
    queryKey: ["models", { enabled_only: true }],
    queryFn: () => api.getModelsFull(),
  });
}

export function useProviderHealth() {
  return useQuery({
    queryKey: ["provider-health"],
    queryFn: () => api.getProviderHealth(),
    staleTime: 60_000,
  });
}

export function useModel(id: string) {
  return useQuery({
    queryKey: ["models", id],
    queryFn: () => api.getModel(id),
    enabled: !!id,
  });
}
