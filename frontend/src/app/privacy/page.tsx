import type { Metadata } from "next";

import { ContactEmailLink } from "@/components/contact/contact-email-link";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { LegalSection } from "@/components/legal/legal-section";
import { ar } from "@/i18n/ar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: ar.seo.privacy.title,
  description: ar.seo.privacy.description,
  path: "/privacy",
});

export default function PrivacyPage() {
  const { privacy } = ar;

  return (
    <LegalPageLayout title={privacy.title} subtitle={privacy.subtitle} intro={privacy.intro}>
      <LegalSection
        title={privacy.sections.dataCollection.title}
        paragraphs={privacy.sections.dataCollection.paragraphs}
      />
      <LegalSection
        title={privacy.sections.comparisonRequests.title}
        paragraphs={privacy.sections.comparisonRequests.paragraphs}
      />
      <LegalSection
        title={privacy.sections.analytics.title}
        paragraphs={privacy.sections.analytics.paragraphs}
      />
      <LegalSection
        title={privacy.sections.cookies.title}
        paragraphs={privacy.sections.cookies.paragraphs}
      />
      <LegalSection
        title={privacy.sections.thirdParty.title}
        paragraphs={privacy.sections.thirdParty.paragraphs}
        items={privacy.sections.thirdParty.items}
      />
      <LegalSection
        title={privacy.sections.userResponsibilities.title}
        items={privacy.sections.userResponsibilities.items}
      />
      <section className="space-y-4" aria-labelledby="privacy-contact-heading">
        <LegalSection
          title={privacy.sections.contact.title}
          paragraphs={privacy.sections.contact.paragraphs}
        />
        <div id="privacy-contact-heading" className="sr-only">
          {privacy.sections.contact.title}
        </div>
        <ContactEmailLink
          label={ar.contact.emails.privacy.label}
          email={ar.contact.emails.privacy.address}
          description={ar.contact.emails.privacy.description}
        />
      </section>
      <LegalSection
        title={privacy.sections.retention.title}
        paragraphs={privacy.sections.retention.paragraphs}
      />
    </LegalPageLayout>
  );
}
