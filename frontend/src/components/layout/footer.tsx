import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Separator } from "@/components/ui/separator";
import { ar } from "@/i18n/ar";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <Container className="py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{ar.brand}</p>
            <p className="text-sm text-muted-foreground mt-1">{ar.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/compare" className="hover:text-accent transition-colors">
              {ar.nav.compare}
            </Link>
            <Link href="/insights" className="hover:text-accent transition-colors">
              {ar.nav.insights}
            </Link>
            <Link href="/about" className="hover:text-accent transition-colors">
              {ar.nav.about}
            </Link>
            <Link href="/contact" className="hover:text-accent transition-colors">
              {ar.nav.contact}
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{ar.footer.legal}</span>
          <Link href="/privacy" className="hover:text-accent transition-colors">
            {ar.nav.privacy}
          </Link>
          <Link href="/terms" className="hover:text-accent transition-colors">
            {ar.nav.terms}
          </Link>
        </div>

        <Separator className="my-6" />
        <div className="space-y-3 text-xs text-muted-foreground text-center max-w-3xl mx-auto">
          <p>{ar.footer.rights}</p>
          <p className="leading-relaxed">{ar.footer.disclaimer}</p>
        </div>
      </Container>
    </footer>
  );
}
