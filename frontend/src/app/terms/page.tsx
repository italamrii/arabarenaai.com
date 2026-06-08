import type { Metadata } from "next";

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { LegalSection } from "@/components/legal/legal-section";
import { getServerLocale, getServerMessages } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  const locale = await getServerLocale();
  return createPageMetadata({
    title: t.seo.terms.title,
    description: t.seo.terms.description,
    path: "/terms",
    locale,
  });
}

export default async function TermsPage() {
  const t = await getServerMessages();
  const { terms } = t;

  return (
    <LegalPageLayout title={terms.title} subtitle={terms.subtitle} intro={terms.intro}>
      <LegalSection title={terms.sections.acceptableUse.title} items={terms.sections.acceptableUse.items} />
      <LegalSection
        title={terms.sections.userContent.title}
        paragraphs={terms.sections.userContent.paragraphs}
        items={terms.sections.userContent.items}
      />
      <LegalSection
        title={terms.sections.independence.title}
        paragraphs={terms.sections.independence.paragraphs}
      />
      <LegalSection
        title={terms.sections.noAccuracyGuarantee.title}
        paragraphs={terms.sections.noAccuracyGuarantee.paragraphs}
      />
      <LegalSection
        title={terms.sections.notProfessionalAdvice.title}
        paragraphs={terms.sections.notProfessionalAdvice.paragraphs}
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
