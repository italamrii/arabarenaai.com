import type { Metadata } from "next";

import { LegalSection } from "@/components/legal/legal-section";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { ar } from "@/i18n/ar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: ar.seo.terms.title,
  description: ar.seo.terms.description,
  path: "/terms",
});

export default function TermsPage() {
  const { terms } = ar;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={terms.title} subtitle={terms.subtitle} className="mb-10" />

      <div className="max-w-3xl space-y-8 animate-fade-in">
        <p className="text-muted-foreground leading-relaxed">{terms.intro}</p>

        <LegalSection
          title={terms.sections.acceptableUse.title}
          items={terms.sections.acceptableUse.items}
        />
        <LegalSection
          title={terms.sections.noAccuracyGuarantee.title}
          paragraphs={terms.sections.noAccuracyGuarantee.paragraphs}
        />
        <LegalSection
          title={terms.sections.availability.title}
          paragraphs={terms.sections.availability.paragraphs}
        />
        <LegalSection
          title={terms.sections.thirdPartyDependency.title}
          paragraphs={terms.sections.thirdPartyDependency.paragraphs}
        />
        <LegalSection
          title={terms.sections.liability.title}
          paragraphs={terms.sections.liability.paragraphs}
        />
        <LegalSection
          title={terms.sections.intellectualProperty.title}
          paragraphs={terms.sections.intellectualProperty.paragraphs}
        />
        <LegalSection
          title={terms.sections.userResponsibilities.title}
          items={terms.sections.userResponsibilities.items}
        />
      </div>
    </Container>
  );
}
