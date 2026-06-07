import type { Metadata } from "next";

import { ContactEmailLink } from "@/components/contact/contact-email-link";
import { ContactForm } from "@/components/contact/contact-form";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ar } from "@/i18n/ar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: ar.seo.contact.title,
  description: ar.seo.contact.description,
  path: "/contact",
});

export default function ContactPage() {
  const emailEntries = Object.values(ar.contact.emails);

  return (
    <LegalPageLayout title={ar.contact.title} subtitle={ar.contact.subtitle}>
      <section aria-labelledby="contact-emails-heading" className="space-y-4">
        <div>
          <h2 id="contact-emails-heading" className="text-lg font-semibold">
            {ar.contact.emailSection.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {ar.contact.emailSection.note}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {emailEntries.map((entry) => (
            <ContactEmailLink
              key={entry.address}
              label={entry.label}
              email={entry.address}
              description={entry.description}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-border/80 bg-card/40">
          <CardHeader>
            <CardTitle className="text-base">{ar.contact.general.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ar.contact.general.body}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/40">
          <CardHeader>
            <CardTitle className="text-base">{ar.contact.business.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ar.contact.business.body}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{ar.contact.form.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </LegalPageLayout>
  );
}
