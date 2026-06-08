import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getServerMessages } from "@/i18n/server";

export default async function NotFoundPage() {
  const t = await getServerMessages();

  return (
    <Container className="py-20 sm:py-28 text-center">
      <p className="text-sm font-medium text-accent mb-3" aria-hidden="true">
        404
      </p>
      <h1 className="text-2xl sm:text-3xl font-bold">{t.notFound.title}</h1>
      <p className="mt-3 text-muted-foreground max-w-md mx-auto leading-relaxed">
        {t.notFound.description}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/">{t.notFound.goHome}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/compare">{t.nav.compare}</Link>
        </Button>
      </div>
    </Container>
  );
}
