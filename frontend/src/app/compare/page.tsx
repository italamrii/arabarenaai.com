"use client";



import { useRouter } from "next/navigation";

import { useEffect, useMemo, useRef, useState } from "react";

import { AlertCircle, Loader2 } from "lucide-react";



import { CategoryPicker } from "@/components/categories/category-picker";

import { CompareEmptyState } from "@/components/comparison/compare-empty-state";

import { CompareGuide } from "@/components/comparison/compare-guide";
import { AiContentNotice } from "@/components/legal/ai-content-notice";

import { CompareStep } from "@/components/comparison/compare-step";

import { CompareSubmitBar } from "@/components/comparison/compare-submit-bar";

import { ModelPicker } from "@/components/comparison/model-picker";
import { PromptAttachment } from "@/components/comparison/prompt-attachment";

import { Container } from "@/components/layout/container";

import { PageHeader } from "@/components/shared/page-header";

import { ComparePageSkeleton } from "@/components/shared/loading-skeletons";

import { ErrorBoundary } from "@/components/shared/error-boundary";

import { Label } from "@/components/ui/label";

import { Skeleton } from "@/components/ui/skeleton";

import { Textarea } from "@/components/ui/textarea";

import { useCategories, useCategoryDetect } from "@/hooks/use-categories";

import { useModels, useProviderHealth } from "@/hooks/use-models";

import { useCreateComparison } from "@/hooks/use-comparison";

import { api, ApiClientError } from "@/lib/api/client";
import type { UploadResult } from "@/lib/api/types";

import { useLocale, useTranslations } from "@/i18n/locale-context";
import { apiErrorMessage } from "@/lib/i18n/display";



export default function ComparePage() {

  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();

  const [prompt, setPrompt] = useState("");

  const [autoDetect, setAutoDetect] = useState(false);

  const [categoryKey, setCategoryKey] = useState<string | null>(null);

  const [categoryManual, setCategoryManual] = useState(false);

  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [attachment, setAttachment] = useState<UploadResult | null>(null);

  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);



  const { data: categoriesData, isLoading: loadingCategories } = useCategories();

  const {

    data: modelsData,

    isLoading: loadingModels,

    isError: modelsError,

  } = useModels();

  const { data: providerHealthProviders } = useProviderHealth();

  const detectQuery = useCategoryDetect(prompt, autoDetect);

  const createMutation = useCreateComparison();



  const models = modelsData?.models;

  const minSelection = modelsData?.meta?.min_selection ?? 2;

  const maxSelection = modelsData?.meta?.max_selection ?? 10;



  const unavailableProviderKeys = useMemo(() => {

    const keys = new Set<string>();

    for (const provider of providerHealthProviders ?? []) {

      if (provider.status !== "healthy") {

        keys.add(provider.key);

      }

    }

    return keys;

  }, [providerHealthProviders]);



  const unavailableProviderMessages = useMemo(() => {

    const messages: Record<string, string> = {};

    if (locale !== "ar") return messages;

    for (const provider of providerHealthProviders ?? []) {

      if (provider.status !== "healthy" && provider.message_ar) {

        messages[provider.key] = provider.message_ar;

      }

    }

    return messages;

  }, [providerHealthProviders, locale]);



  useEffect(() => {

    if (!models || unavailableProviderKeys.size === 0) return;

    setSelectedModelIds((ids) =>

      ids.filter((id) => {

        const model = models.find((m) => m.id === id);

        return (

          model &&

          !model.is_placeholder &&

          !unavailableProviderKeys.has(model.provider.key)

        );

      }),

    );

  }, [models, unavailableProviderKeys]);



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

  const hasAttachment = !!attachment;

  const hasPrompt = trimmedPrompt.length > 0 || hasAttachment;

  const attachmentKind = attachment
    ? attachment.mime_type === "application/pdf"
      ? ("pdf" as const)
      : ("image" as const)
    : null;

  const hasEnoughModels = selectedModelIds.length >= minSelection;

  const hasCategory = autoDetect || !!categoryKey;



  const isReady =
    hasPrompt &&
    hasEnoughModels &&
    hasCategory &&
    !modelsError &&
    !!models &&
    !uploadingAttachment;



  const statusMessage = useMemo(() => {

    if (!hasPrompt) return t.compare.needsPrompt;

    if (modelsError) return t.compare.modelsLoadError;

    if (!hasEnoughModels) return t.compare.needsModels;

    if (!hasCategory) return t.compare.needsCategory;

    return t.compare.readyToCompare;

  }, [hasPrompt, hasEnoughModels, hasCategory, modelsError, t]);



  async function handleSelectAttachment(file: File) {
    setAttachmentError(null);
    setUploadingAttachment(true);
    try {
      const uploaded = await api.uploadAttachment(file);
      setAttachment(uploaded);
    } catch (err) {
      setAttachment(null);
      setAttachmentError(
        err instanceof ApiClientError ? apiErrorMessage(err, locale) : t.compare.attachment.uploadFailed,
      );
    } finally {
      setUploadingAttachment(false);
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {

    e?.preventDefault();

    setError(null);

    if (!trimmedPrompt && !attachment) {
      setError(t.compare.needsPrompt);
      return;
    }

    if (!autoDetect && !categoryKey) {

      setError(t.compare.needsCategory);

      return;

    }



    const selectableModelIds = selectedModelIds.filter((id) => {

      const model = models?.find((m) => m.id === id);

      return (

        model &&

        !model.is_placeholder &&

        !unavailableProviderKeys.has(model.provider.key)

      );

    });



    if (selectableModelIds.length < minSelection) {

      setError(t.compare.minModels);

      return;

    }

    if (selectableModelIds.length > maxSelection) {

      setError(t.compare.maxModels);

      return;

    }



    try {

      const payload = {

        prompt: trimmedPrompt,

        category_mode: autoDetect ? ("auto" as const) : ("manual" as const),

        model_ids: selectableModelIds,

        ...(attachment ? { attachment_id: attachment.id } : {}),

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

        setError(apiErrorMessage(err, locale));

      } else {

        setError(t.errors.generic);

      }

    }

  };



  const initialLoading = loadingCategories && loadingModels && !categoriesData && !modelsData;



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

        <PageHeader title={t.compare.title} subtitle={t.compare.subtitle} className="mb-6 sm:mb-8" />

        <CompareGuide />
        <AiContentNotice className="mb-2 max-w-4xl mx-auto" />

        <ErrorBoundary>

          <form

            ref={formRef}

            onSubmit={handleSubmit}

            className="max-w-4xl mx-auto space-y-10 sm:space-y-12"

            aria-label={t.compare.title}

          >

            <CompareStep step={1} title={t.compare.promptStep}>

              <div className="card-premium p-5 sm:p-8 space-y-4">

                <Label htmlFor="prompt" className="section-label">

                  {t.compare.promptLabel}

                </Label>

                <PromptAttachment
                  attachment={attachment}
                  uploading={uploadingAttachment}
                  error={attachmentError}
                  onSelectFile={(file) => void handleSelectAttachment(file)}
                  onRemove={() => {
                    setAttachment(null);
                    setAttachmentError(null);
                  }}
                />

                <Textarea

                  id="prompt"

                  value={prompt}

                  onChange={(e) => setPrompt(e.target.value)}

                  placeholder={t.compare.promptPlaceholder}

                  maxLength={4000}

                  dir="auto"

                  aria-describedby="prompt-hint prompt-counter"

                  className="min-h-[160px] sm:min-h-[220px] text-base bg-background/50 border-border/80 focus-visible:ring-accent/60 leading-relaxed"

                />

                {!trimmedPrompt && !hasAttachment ? (

                  <p className="text-xs text-muted-foreground/80" role="status">

                    {t.compare.emptyPrompt}

                  </p>

                ) : null}

                <div className="flex items-center justify-between text-xs text-muted-foreground gap-4">

                  <span id="prompt-hint">{t.compare.promptHint}</span>

                  <span id="prompt-counter" className="tabular-nums shrink-0">

                    {prompt.length} / 4000

                  </span>

                </div>

              </div>

            </CompareStep>



            <CompareStep step={2} title={t.compare.categoryStep}>

              <div className="card-premium p-5 sm:p-6">

                {loadingCategories && !categoriesData ? (

                  <div className="space-y-3" role="status" aria-live="polite">

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">

                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />

                      {t.compare.needsCategory}

                    </div>

                    <Skeleton className="h-10 w-full" />

                    <Skeleton className="h-10 w-2/3" />

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

                ) : (

                  <CompareEmptyState

                    title={t.compare.needsCategory}

                    description={t.errors.generic}

                    variant="error"

                  />

                )}

              </div>

            </CompareStep>



            <CompareStep step={3} title={t.compare.modelsStep}>

              <div className="card-premium p-5 sm:p-6 space-y-4">

                {loadingModels && !models ? (

                  <div className="space-y-3" role="status" aria-live="polite">

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">

                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />

                      {t.compare.modelsLoading}

                    </div>

                    <Skeleton className="h-16 w-full" />

                    <Skeleton className="h-16 w-full" />

                  </div>

                ) : null}



                {modelsError ? (

                  <CompareEmptyState

                    title={t.compare.modelsLoadError}

                    variant="error"

                  />

                ) : null}



                {models && models.length > 0 ? (

                  <ModelPicker

                    models={models}

                    selectedIds={selectedModelIds}

                    min={minSelection}

                    max={maxSelection}

                    unavailableProviderKeys={unavailableProviderKeys}

                    unavailableProviderMessages={unavailableProviderMessages}

                    attachmentKind={attachmentKind}

                    onChange={setSelectedModelIds}

                  />

                ) : null}



                {models && models.length === 0 && !loadingModels ? (

                  <CompareEmptyState

                    title={t.compare.emptyModelsTitle}

                    description={t.compare.emptyModelsDescription}

                  />

                ) : null}

              </div>

            </CompareStep>



            {error ? (

              <div

                role="alert"

                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm"

              >

                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />

                {error}

              </div>

            ) : null}

          </form>

        </ErrorBoundary>

      </Container>



      <CompareSubmitBar

        promptLength={prompt.length}

        modelCount={selectedModelIds.length}

        maxModels={maxSelection}

        isReady={isReady}

        statusMessage={statusMessage}

        isSubmitting={createMutation.isPending || uploadingAttachment}

        hasAttachment={hasAttachment}

        onSubmit={() => handleSubmit()}

      />

    </>

  );

}


