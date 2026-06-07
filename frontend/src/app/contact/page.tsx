import type { Metadata } from "next";

import { ContactForm } from "@/components/contact/contact-form";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ar } from "@/i18n/ar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: ar.seo.contact.title,
  description: ar.seo.contact.description,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={ar.contact.title} subtitle={ar.contact.subtitle} className="mb-10" />

      <div className="max-w-3xl space-y-8 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>{ar.contact.emailSection.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium" dir="ltr">
              {ar.contact.emailSection.placeholder}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {ar.contact.emailSection.note}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{ar.contact.general.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ar.contact.general.body}
              </p>
            </CardContent>
          </Card>

          <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>{ar.contact.form.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
