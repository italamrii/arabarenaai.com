"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.getCategoriesFull();
      return {
        categories: res.categories,
        defaultKey: res.meta?.default_key ?? "general",
        supportsAutoDetect: res.meta?.supports_auto_detect ?? true,
      };
    },
  });
}

export function useCategoryDetect(prompt: string, enabled: boolean) {
  return useQuery({
    queryKey: ["category-detect", prompt],
    queryFn: () => api.detectCategory(prompt),
    enabled: enabled && prompt.trim().length > 10,
    staleTime: 60_000,
  });
}
