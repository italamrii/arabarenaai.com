import type { Metadata } from "next";

import { ContactBetaNotice } from "@/components/contact/contact-beta-notice";
import { ContactEmailLink } from "@/components/contact/contact-email-link";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactSocialLink } from "@/components/contact/contact-social-link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerLocale, getServerMessages } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  const locale = await getServerLocale();
  return createPageMetadata({
    title: t.seo.contact.title,
    description: t.seo.contact.description,
    path: "/contact",
    locale,
  });
}

export default async function ContactPage() {
  const t = await getServerMessages();
  const emailEntries = Object.values(t.contact.emails);

  return (
    <LegalPageLayout title={t.contact.title} subtitle={t.contact.subtitle}>
      <section aria-labelledby="contact-emails-heading" className="space-y-4">
        <div>
          <h2 id="contact-emails-heading" className="text-lg font-semibold">
            {t.contact.emailSection.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {t.contact.emailSection.note}
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

      <ContactSocialLink />

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-border/80 bg-card/40">
          <CardHeader>
            <CardTitle className="text-base">{t.contact.general.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.contact.general.body}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/40">
          <CardHeader>
            <CardTitle className="text-base">{t.contact.business.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.contact.business.body}
            </p>
          </CardContent>
        </Card>
      </div>

      <ContactBetaNotice />

      <Card className="border-border/80 bg-card/40">
        <CardHeader>
          <CardTitle>{t.contact.form.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </LegalPageLayout>
  );
}
