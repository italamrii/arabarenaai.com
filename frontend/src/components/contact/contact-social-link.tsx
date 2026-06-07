import { ExternalLink } from "lucide-react";

import { ar } from "@/i18n/ar";

export function ContactSocialLink() {
  return (
    <div className="rounded-xl border border-border/80 bg-card/40 p-4 sm:p-5 space-y-2">
      <p className="text-sm font-medium text-foreground">{ar.contact.social.title}</p>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {ar.contact.social.description}
      </p>
      <a
        href={ar.contact.social.xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
        dir="ltr"
        aria-label={`${ar.contact.social.xHandle} on X`}
      >
        {ar.contact.social.xHandle}
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </a>
    </div>
  );
}
