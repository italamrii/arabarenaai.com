"use client";

import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/i18n/locale-context";

export function Footer() {
  const t = useTranslations();

  const primaryLinks = [
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
    { href: "/privacy", label: t.nav.privacy },
    { href: "/terms", label: t.nav.terms },
  ] as const;

  const productLinks = [
    { href: "/compare", label: t.nav.compare },
    { href: "/insights", label: t.nav.insights },
  ] as const;

  return (
    <footer className="border-t border-border mt-auto bg-card/20" role="contentinfo">
      <Container className="py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight">{t.brand}</p>
            <p className="text-sm text-muted-foreground">{t.footer.platformTagline}</p>
            <p className="text-xs text-muted-foreground pt-1">{t.footer.tagline}</p>
          </div>

          <nav aria-label={t.footer.legal} className="space-y-3">
            <p className="text-sm font-medium text-foreground/90">{t.footer.legal}</p>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              {primaryLinks.map((link) => (
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

          <nav aria-label={t.footer.product} className="space-y-3">
            <p className="text-sm font-medium text-foreground/90">{t.footer.product}</p>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              {productLinks.map((link) => (
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
          <p>{t.footer.rights}</p>
          <p className="leading-relaxed">{t.footer.disclaimer}</p>
        </div>
      </Container>
    </footer>
  );
}
