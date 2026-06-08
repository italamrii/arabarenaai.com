import { getServerMessages } from "@/i18n/server";

export async function ContactBetaNotice() {
  const t = await getServerMessages();

  return (
    <div
      className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-4 sm:px-5 space-y-1.5"
      aria-label={t.contact.beta.title}
    >
      <p className="text-sm font-semibold text-foreground">{t.contact.beta.title}</p>
      {t.contact.beta.subtitle ? (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t.contact.beta.subtitle}
        </p>
      ) : null}
    </div>
  );
}
