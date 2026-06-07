"use client";

import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ar } from "@/i18n/ar";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-20 text-center">
      <h1 className="text-2xl font-bold">{ar.errors.generic}</h1>
      <p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={reset} variant="outline">
          {ar.errors.retry}
        </Button>
        <Button asChild>
          <Link href="/">{ar.errors.goHome}</Link>
        </Button>
      </div>
    </Container>
  );
}
