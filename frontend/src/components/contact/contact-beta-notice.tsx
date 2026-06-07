import { ar } from "@/i18n/ar";

export function ContactBetaNotice() {
  return (
    <div
      className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-4 sm:px-5 space-y-1.5"
      aria-label={ar.contact.beta.title}
    >
      <p className="text-sm font-semibold text-foreground">{ar.contact.beta.title}</p>
      {ar.contact.beta.subtitle ? (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {ar.contact.beta.subtitle}
        </p>
      ) : null}
    </div>
  );
}
