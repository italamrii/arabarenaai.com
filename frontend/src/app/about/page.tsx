import type { Metadata } from "next";

import { DisclaimerBanner } from "@/components/analytics/disclaimer-banner";
import { AiContentNotice } from "@/components/legal/ai-content-notice";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { LegalSection } from "@/components/legal/legal-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerLocale, getServerMessages } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  const locale = await getServerLocale();
  return createPageMetadata({
    title: t.seo.about.title,
    description: t.seo.about.description,
    path: "/about",
    locale,
  });
}

export default async function AboutPage() {
  const t = await getServerMessages();

  return (
    <LegalPageLayout title={t.about.title}>
      <DisclaimerBanner />
      <AiContentNotice />

      <LegalSection
        title={t.about.independence.title}
        paragraphs={t.about.independence.paragraphs}
      />

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{t.about.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{t.about.intro.paragraph1}</p>
          <p className="text-muted-foreground leading-relaxed">{t.about.intro.paragraph2}</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{t.about.mission.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{t.about.mission.body}</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{t.about.methodology.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3" role="list">
            {t.about.methodology.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{t.about.transparency.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{t.about.transparency.body}</p>
        </CardContent>
      </Card>
    </LegalPageLayout>
  );
}
