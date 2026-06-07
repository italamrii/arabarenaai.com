import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  intro?: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, subtitle, intro, children }: LegalPageLayoutProps) {
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader title={title} subtitle={subtitle} className="mb-8 sm:mb-10" />

      <article className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
        {intro ? (
          <p className="text-base text-muted-foreground leading-relaxed border-s-2 border-accent/30 ps-4">
            {intro}
          </p>
        ) : null}
        {children}
      </article>
    </Container>
  );
}
