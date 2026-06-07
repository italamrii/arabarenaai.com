"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { CategoryPicker } from "@/components/categories/category-picker";
import { CompareStep } from "@/components/comparison/compare-step";
import { CompareSubmitBar } from "@/components/comparison/compare-submit-bar";
import { ModelPicker } from "@/components/comparison/model-picker";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { ComparePageSkeleton } from "@/components/shared/loading-skeletons";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, useCategoryDetect } from "@/hooks/use-categories";
import { normalizeModelsQueryData, useModels, useProviderHealth } from "@/hooks/use-models";
import { useCreateComparison } from "@/hooks/use-comparison";
import { ApiClientError } from "@/lib/api/client";
import { ar } from "@/i18n/ar";

export default function ComparePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [autoDetect, setAutoDetect] = useState(false);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [categoryManual, setCategoryManual] = useState(false);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: categoriesData, isLoading: loadingCategories } = useCategories();
  const modelsQuery = useModels();
  const providerHealthQuery = useProviderHealth();
  const detectQuery = useCategoryDetect(prompt, autoDetect);
  const createMutation = useCreateComparison();

  const {
    data: modelsData,
    isLoading: loadingModels,
    isError: modelsQueryError,
    error: modelsQueryErrorObj,
  } = modelsQuery;
  const {
    data: providerHealthProviders,
    isError: providerHealthQueryError,
    error: providerHealthQueryErrorObj,
  } = providerHealthQuery;

  const normalizedModelsData = normalizeModelsQueryData(modelsData);
  const models = normalizedModelsData.models;
  const minSelection = normalizedModelsData.meta?.min_selection ?? 2;
  const maxSelection = normalizedModelsData.meta?.max_selection ?? 10;

  // Only the models query may trigger the Arabic load error — never provider health.
  const showModelsLoadError = modelsQueryError;
  const showModelsEmptyMessage =
    modelsQuery.isSuccess && !loadingModels && models.length === 0;

  useEffect(() => {
    console.log("[ComparePage] models query", {
      isLoading: modelsQuery.isLoading,
      isError: modelsQuery.isError,
      isSuccess: modelsQuery.isSuccess,
      error: modelsQueryErrorObj,
      data: modelsData,
    });
    console.log("[ComparePage] parsed modelsData", normalizedModelsData);
    console.log("[ComparePage] modelsData.models", models);
    console.log("[ComparePage] provider health query", {
      isLoading: providerHealthQuery.isLoading,
      isError: providerHealthQuery.isError,
      isSuccess: providerHealthQuery.isSuccess,
      error: providerHealthQueryErrorObj,
      data: providerHealthProviders,
    });
    console.log("[ComparePage] error render conditions", {
      showModelsLoadError,
      showModelsEmptyMessage,
      showModelPicker: models.length > 0,
      modelsQueryErrorOnly: modelsQueryError,
      providerHealthQueryErrorIgnored: providerHealthQueryError,
    });
  }, [
    models,
    modelsData,
    modelsQuery.isLoading,
    modelsQuery.isError,
    modelsQuery.isSuccess,
    modelsQueryErrorObj,
    normalizedModelsData,
    providerHealthProviders,
    providerHealthQuery.isLoading,
    providerHealthQuery.isError,
    providerHealthQuery.isSuccess,
    providerHealthQueryError,
    providerHealthQueryErrorObj,
    modelsQueryError,
    showModelsEmptyMessage,
    showModelsLoadError,
  ]);

  const unavailableProviderKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const provider of providerHealthProviders ?? []) {
      if (provider.status !== "healthy") {
        keys.add(provider.key);
      }
    }
    return keys;
  }, [providerHealthProviders]);

  useEffect(() => {
    if (categoriesData?.defaultKey && categoryKey === null && !autoDetect) {
      setCategoryKey(categoriesData.defaultKey);
    }
  }, [categoriesData, categoryKey, autoDetect]);

  useEffect(() => {
    if (autoDetect && detectQuery.data?.suggested_category && !categoryManual) {
      setCategoryKey(detectQuery.data.suggested_category.key);
    }
  }, [autoDetect, detectQuery.data, categoryManual]);

  const trimmedPrompt = prompt.trim();
  const hasPrompt = trimmedPrompt.length > 0;
  const hasEnoughModels = selectedModelIds.length >= minSelection;
  const hasCategory = autoDetect || !!categoryKey;

  const isReady =
    hasPrompt && hasEnoughModels && hasCategory && !showModelsLoadError && models.length > 0;

  const statusMessage = useMemo(() => {
    if (!hasPrompt) return ar.compare.needsPrompt;
    if (showModelsLoadError) return ar.compare.modelsLoadError;
    if (!hasEnoughModels) return ar.compare.needsModels;
    if (!hasCategory) return ar.compare.needsCategory;
    return ar.compare.readyToCompare;
  }, [hasPrompt, hasEnoughModels, hasCategory, showModelsLoadError]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!autoDetect && !categoryKey) {
      setError(ar.compare.needsCategory);
      return;
    }

    if (selectedModelIds.length < minSelection) {
      setError(ar.compare.minModels);
      return;
    }
    if (selectedModelIds.length > maxSelection) {
      setError(ar.compare.maxModels);
      return;
    }

    try {
      const payload = {
        prompt: trimmedPrompt,
        category_mode: autoDetect ? ("auto" as const) : ("manual" as const),
        model_ids: selectedModelIds,
        ...(autoDetect
          ? categoryKey
            ? { category_key: categoryKey }
            : {}
          : { category_key: categoryKey! }),
      };

      const result = await createMutation.mutateAsync(payload);
      router.push(`/results/${result.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.messageAr);
      } else {
        setError(ar.errors.generic);
      }
    }
  };

  const initialLoading = loadingCategories && loadingModels;

  if (initialLoading) {
    return (
      <Container className="py-10 pb-28">
        <ComparePageSkeleton />
      </Container>
    );
  }

  return (
    <>
      <Container className="py-10 sm:py-12 pb-32">
        <PageHeader title={ar.compare.title} subtitle={ar.compare.subtitle} className="mb-12" />

        <ErrorBoundary>
          <form ref={formRef} onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-12">
            <CompareStep step={1} title={ar.compare.promptStep}>
              <div className="card-premium p-6 sm:p-8 space-y-4">
                <Label htmlFor="prompt" className="section-label">
                  {ar.compare.promptLabel}
                </Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={ar.compare.promptPlaceholder}
                  maxLength={4000}
                  required
                  dir="auto"
                  className="min-h-[180px] sm:min-h-[220px] text-base bg-background/50 border-border/80 focus-visible:ring-accent/60 leading-relaxed"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{ar.compare.promptHint}</span>
                  <span className="tabular-nums">{prompt.length} / 4000</span>
                </div>
              </div>
            </CompareStep>

            <CompareStep step={2} title={ar.compare.categoryStep}>
              <div className="card-premium p-6">
                {loadingCategories ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ar.compare.needsCategory}
                  </div>
                ) : categoriesData ? (
                  <CategoryPicker
                    categories={categoriesData.categories}
                    selectedKey={categoryKey}
                    autoDetect={autoDetect}
                    detecting={detectQuery.isFetching}
                    onSelect={(key) => {
                      setCategoryManual(true);
                      setCategoryKey(key);
                    }}
                    onAutoDetectChange={(v) => {
                      setAutoDetect(v);
                      setCategoryManual(false);
                      if (!v && categoriesData.defaultKey) {
                        setCategoryKey(categoriesData.defaultKey);
                      }
                    }}
                  />
                ) : null}
              </div>
            </CompareStep>

            <CompareStep step={3} title={ar.compare.modelsStep}>
              <div className="card-premium p-6 space-y-4">
                {loadingModels && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ar.compare.modelsLoading}
                  </div>
                )}

                {showModelsLoadError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {ar.compare.modelsLoadError}
                  </div>
                )}

                {models.length > 0 && (
                  <ModelPicker
                    models={models}
                    selectedIds={selectedModelIds}
                    min={minSelection}
                    max={maxSelection}
                    unavailableProviderKeys={unavailableProviderKeys}
                    onChange={setSelectedModelIds}
                  />
                )}

                {showModelsEmptyMessage && (
                  <p className="text-sm text-muted-foreground">{ar.compare.modelsLoadError}</p>
                )}
              </div>
            </CompareStep>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </form>
        </ErrorBoundary>
      </Container>

      <CompareSubmitBar
        promptLength={prompt.length}
        modelCount={selectedModelIds.length}
        maxModels={maxSelection}
        isReady={isReady}
        statusMessage={statusMessage}
        isSubmitting={createMutation.isPending}
        onSubmit={() => handleSubmit()}
      />
    </>
  );
}
