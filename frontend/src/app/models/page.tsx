"use client";

import { Cpu } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/loading-skeletons";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useModels } from "@/hooks/use-models";
import type { Model } from "@/lib/api/types";
import { ar } from "@/i18n/ar";

export default function ModelsPage() {
  const { data: models, isLoading } = useModels();

  if (isLoading) {
    return (
      <Container className="py-10">
        <PageSkeleton />
      </Container>
    );
  }

  const grouped = (models ?? []).reduce<Record<string, Model[]>>((acc, model) => {
    const key = model.provider.key;
    if (!acc[key]) acc[key] = [];
    acc[key].push(model);
    return acc;
  }, {});

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={ar.models.title} subtitle={ar.models.subtitle} className="mb-10" />

      <ErrorBoundary>
        <div className="grid gap-8">
          {Object.entries(grouped).map(([providerKey, providerModels]) => (
            <section key={providerKey}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-accent" />
                {providerModels?.[0]?.provider.name_ar ?? providerKey}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providerModels?.map((model) => (
                  <Card
                    key={model.id}
                    className={model.is_placeholder ? "opacity-60" : "hover:border-accent/30 transition-colors"}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">{model.name_ar}</p>
                        {model.is_placeholder ? (
                          <Badge variant="disabled">{ar.models.placeholder}</Badge>
                        ) : (
                          <Badge variant="default">{ar.models.available}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        {ar.models.provider}: {model.provider.name_ar}
                      </p>
                      {model.name_en && <p>{model.name_en}</p>}
                      <p className="text-xs font-mono" dir="ltr">
                        {model.key}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </ErrorBoundary>
    </Container>
  );
}
