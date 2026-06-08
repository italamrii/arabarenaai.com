import { ExternalLink } from "lucide-react";

import { getServerMessages } from "@/i18n/server";

export async function ContactSocialLink() {
  const t = await getServerMessages();

  return (
    <div className="rounded-xl border border-border/80 bg-card/40 p-4 sm:p-5 space-y-2">
      <p className="text-sm font-medium text-foreground">{t.contact.social.title}</p>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {t.contact.social.description}
      </p>
      <a
        href={t.contact.social.xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
        dir="ltr"
        aria-label={`${t.contact.social.xHandle} on X`}
      >
        {t.contact.social.xHandle}
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </a>
    </div>
  );
}
