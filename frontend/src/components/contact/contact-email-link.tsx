import { Mail } from "lucide-react";

interface ContactEmailLinkProps {
  label: string;
  email: string;
  description?: string;
}

export function ContactEmailLink({ label, email, description }: ContactEmailLinkProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/40 p-4 sm:p-5 space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description ? (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
      ) : null}
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
        dir="ltr"
        aria-label={`${label}: ${email}`}
      >
        <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
        {email}
      </a>
    </div>
  );
}
