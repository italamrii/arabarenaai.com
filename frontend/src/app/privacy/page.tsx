import type { Metadata } from "next";

import { LegalSection } from "@/components/legal/legal-section";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
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
    <Container className="py-10 sm:py-14">
      <PageHeader title={privacy.title} subtitle={privacy.subtitle} className="mb-10" />

      <div className="max-w-3xl space-y-8 animate-fade-in">
        <p className="text-muted-foreground leading-relaxed">{privacy.intro}</p>

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
        <LegalSection
          title={privacy.sections.contact.title}
          paragraphs={privacy.sections.contact.paragraphs}
        />
        <LegalSection
          title={privacy.sections.retention.title}
          paragraphs={privacy.sections.retention.paragraphs}
        />
      </div>
    </Container>
  );
}
