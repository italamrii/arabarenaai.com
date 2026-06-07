"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, BarChart3, Languages, Users } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ar } from "@/i18n/ar";

const icons = [Languages, BarChart3, Users];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <Container>
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm text-accent mb-6">
              <Sparkles className="h-4 w-4" />
              {ar.brandTagline}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {ar.home.heroTitle}{" "}
              <span className="text-gradient">{ar.home.heroHighlight}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {ar.home.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/compare">{ar.home.cta}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/insights">{ar.home.ctaSecondary}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 border-t border-border/50">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {ar.home.features.map((feature, i) => {
              const Icon = icons[i] ?? Sparkles;
              return (
                <Card key={feature.title} className="hover:border-accent/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-4">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container size="narrow">
          <h2 className="text-2xl font-bold text-center mb-10">{ar.home.howItWorks}</h2>
          <ol className="space-y-4">
            {ar.home.steps.map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-sm">
                  {i + 1}
                </span>
                <span className="text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Button asChild variant="secondary">
              <Link href="/compare">
                {ar.home.cta}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
