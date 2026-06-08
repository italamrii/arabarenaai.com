export interface ModelStats {
  total: number;
  selectable: number;
  placeholder: number;
  unavailableProvider: number;
  byProvider: Array<{ providerKey: string; providerNameAr: string; count: number }>;
}

interface AdminModel {
  is_placeholder: boolean;
  provider: { key: string; name_ar: string };
}

export function buildModelStats(
  models: AdminModel[] | null | undefined,
  unhealthyProviderKeys: Set<string>,
): ModelStats | null {
  if (!Array.isArray(models) || models.length === 0) return null;

  let selectable = 0;
  let placeholder = 0;
  let unavailableProvider = 0;
  const byProvider = new Map<string, { providerNameAr: string; count: number }>();

  for (const model of models) {
    const providerKey = model.provider.key;
    const bucket = byProvider.get(providerKey) ?? {
      providerNameAr: model.provider.name_ar,
      count: 0,
    };
    bucket.count += 1;
    byProvider.set(providerKey, bucket);

    if (model.is_placeholder) {
      placeholder += 1;
      continue;
    }
    if (unhealthyProviderKeys.has(providerKey)) {
      unavailableProvider += 1;
      continue;
    }
    selectable += 1;
  }

  return {
    total: models.length,
    selectable,
    placeholder,
    unavailableProvider,
    byProvider: [...byProvider.entries()].map(([providerKey, value]) => ({
      providerKey,
      providerNameAr: value.providerNameAr,
      count: value.count,
    })),
  };
}

export function unhealthyProviderKeysFromHealth(
  providerHealth: Array<{ key: string; status: string }> | null | undefined,
): Set<string> {
  const keys = new Set<string>();
  if (!Array.isArray(providerHealth)) return keys;
  for (const provider of providerHealth) {
    if (provider.status !== "healthy") {
      keys.add(provider.key);
    }
  }
  return keys;
}
