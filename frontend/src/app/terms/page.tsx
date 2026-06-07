import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { LegalSection } from "@/components/legal/legal-section";
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
    <LegalPageLayout title={terms.title} subtitle={terms.subtitle} intro={terms.intro}>
      <LegalSection title={terms.sections.acceptableUse.title} items={terms.sections.acceptableUse.items} />
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
    </LegalPageLayout>
  );
}
