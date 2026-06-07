"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export function useModels() {
  return useQuery({
    queryKey: ["models"],
    queryFn: () => api.getModels(),
  });
}

export function useModel(id: string) {
  return useQuery({
    queryKey: ["models", id],
    queryFn: () => api.getModel(id),
    enabled: !!id,
  });
}
