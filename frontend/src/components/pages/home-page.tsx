"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, BarChart3, Languages, Users } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/i18n/locale-context";

const FEATURE_ICONS = [Languages, BarChart3, Users] as const;

export function HomePage() {
  const t = useTranslations();

  return (
    <>
      <section
        className="relative overflow-hidden py-20 sm:py-28 lg:py-32"
        aria-labelledby="home-hero-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.08),transparent_55%)]"
          aria-hidden="true"
        />
        <Container className="relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm text-accent mb-6">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t.brandTagline}
            </div>
            <h1
              id="home-hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15]"
            >
              {t.home.heroTitle}{" "}
              <span className="text-gradient">{t.home.heroHighlight}</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto shadow-[0_0_24px_rgba(0,212,255,0.2)]">
                <Link href="/compare">{t.home.cta}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/insights">{t.home.ctaSecondary}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20 border-t border-border/50" aria-labelledby="home-features-heading">
        <Container>
          <h2 id="home-features-heading" className="sr-only">
            {t.brandTagline}
          </h2>
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {t.home.features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index] ?? Sparkles;
              return (
                <Card
                  key={feature.title}
                  className="h-full border-border/80 bg-card/40 hover:border-accent/35 hover:bg-card/60 transition-all duration-300"
                >
                  <CardContent className="p-6 sm:p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 mb-4">
                      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-lg tracking-tight">{feature.title}</h3>
                    <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20" aria-labelledby="home-steps-heading">
        <Container size="narrow">
          <h2 id="home-steps-heading" className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10">
            {t.home.howItWorks}
          </h2>
          <ol className="space-y-3 sm:space-y-4" role="list">
            {t.home.steps.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-4 rounded-xl border border-border/80 bg-card/40 p-4 sm:p-5 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-sm"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="text-foreground/90 text-sm sm:text-base leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 sm:mt-12 text-center">
            <Button asChild variant="secondary" size="lg">
              <Link href="/compare">
                {t.home.cta}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
