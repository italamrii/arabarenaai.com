"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ApiMeta, Model } from "@/lib/api/types";

export type ModelsQueryData = {
  models: Model[];
  meta?: ApiMeta;
};

/** Normalize React Query cache entries (handles stale array-shaped data). */
export function normalizeModelsQueryData(data: unknown): ModelsQueryData {
  if (Array.isArray(data)) {
    console.warn("[useModels] normalizing stale array-shaped cache", data);
    return { models: data };
  }
  if (data && typeof data === "object" && "models" in data) {
    const record = data as { models?: unknown; meta?: ApiMeta };
    return {
      models: Array.isArray(record.models) ? record.models : [],
      meta: record.meta,
    };
  }
  return { models: [] };
}

export function useModels() {
  return useQuery({
    queryKey: ["models-list", { enabled_only: true }],
    queryFn: async () => {
      const result = await api.getModelsFull();
      console.log("[useModels] queryFn result", result);
      return normalizeModelsQueryData(result);
    },
  });
}

export function useProviderHealth() {
  return useQuery({
    queryKey: ["provider-health"],
    queryFn: async () => {
      const result = await api.getProviderHealth();
      console.log("[useProviderHealth] queryFn result", result);
      return result;
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useModel(id: string) {
  return useQuery({
    queryKey: ["model-detail", id],
    queryFn: () => api.getModel(id),
    enabled: !!id,
  });
}
