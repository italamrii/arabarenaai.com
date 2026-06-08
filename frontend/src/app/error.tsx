"use client";

import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-context";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  return (
    <Container className="py-20 text-center">
      <div role="alert">
      <h1 className="text-2xl font-bold">{t.errors.generic}</h1>
      <p className="mt-2 text-muted-foreground text-sm">{t.errors.retryHint}</p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={reset} variant="outline">
          {t.errors.retry}
        </Button>
        <Button asChild>
          <Link href="/">{t.errors.goHome}</Link>
        </Button>
      </div>
      </div>
    </Container>
  );
}
