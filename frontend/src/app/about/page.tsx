import type { Metadata } from "next";

import { DisclaimerBanner } from "@/components/analytics/disclaimer-banner";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ar } from "@/i18n/ar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: ar.seo.about.title,
  description: ar.seo.about.description,
  path: "/about",
});

export default function AboutPage() {
  return (
    <LegalPageLayout title={ar.about.title}>
      <DisclaimerBanner />

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{ar.about.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{ar.about.intro.paragraph1}</p>
          <p className="text-muted-foreground leading-relaxed">{ar.about.intro.paragraph2}</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{ar.about.mission.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{ar.about.mission.body}</p>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{ar.about.methodology.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3" role="list">
            {ar.about.methodology.items.map((item) => (
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
          <CardTitle>{ar.about.transparency.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{ar.about.transparency.body}</p>
        </CardContent>
      </Card>
    </LegalPageLayout>
  );
}
