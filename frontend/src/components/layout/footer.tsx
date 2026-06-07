import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Separator } from "@/components/ui/separator";
import { ar } from "@/i18n/ar";

const PRIMARY_LINKS = [
  { href: "/about", label: ar.nav.about },
  { href: "/contact", label: ar.nav.contact },
  { href: "/privacy", label: ar.nav.privacy },
  { href: "/terms", label: ar.nav.terms },
] as const;

const PRODUCT_LINKS = [
  { href: "/compare", label: ar.nav.compare },
  { href: "/insights", label: ar.nav.insights },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto bg-card/20" role="contentinfo">
      <Container className="py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight">{ar.brand}</p>
            <p className="text-sm text-muted-foreground">{ar.footer.platformTagline}</p>
            <p className="text-xs text-muted-foreground pt-1">{ar.footer.tagline}</p>
          </div>

          <nav aria-label={ar.footer.legal} className="space-y-3">
            <p className="text-sm font-medium text-foreground/90">{ar.footer.legal}</p>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              {PRIMARY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={ar.footer.product} className="space-y-3">
            <p className="text-sm font-medium text-foreground/90">{ar.footer.product}</p>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Separator className="my-8" />

        <div className="space-y-3 text-xs text-muted-foreground text-center max-w-3xl mx-auto">
          <p>{ar.footer.rights}</p>
          <p className="leading-relaxed">{ar.footer.disclaimer}</p>
        </div>
      </Container>
    </footer>
  );
}
