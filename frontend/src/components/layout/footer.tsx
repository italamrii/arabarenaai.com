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
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} {ar.brand}. {ar.footer.rights}.
        </p>
      </Container>
    </footer>
  );
}
