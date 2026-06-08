"use client";

import { ExternalLink } from "lucide-react";

import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/locale-context";

const PROVIDER_BILLING_LINKS = [
  {
    id: "openai",
    labelKey: "openai" as const,
    href: "https://platform.openai.com/usage",
  },
  {
    id: "anthropic",
    labelKey: "anthropic" as const,
    href: "https://console.anthropic.com/settings/usage",
  },
  {
    id: "google",
    labelKey: "google" as const,
    href: "https://aistudio.google.com/app/apikey",
    secondaryHref: "https://console.cloud.google.com/billing",
    secondaryLabelKey: "googleBilling" as const,
  },
  {
    id: "deepseek",
    labelKey: "deepseek" as const,
    href: "https://platform.deepseek.com/usage",
  },
  {
    id: "xai",
    labelKey: "xai" as const,
    href: "https://console.x.ai/",
  },
] as const;

export function AdminProviderBillingLinks() {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">{t.admin.billingLinks.note}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDER_BILLING_LINKS.map((link) => (
          <AdminDashboardCard key={link.id} title={t.admin.billingLinks.providers[link.labelKey]}>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.admin.billingLinks.openLink.replace(
                    "{provider}",
                    t.admin.billingLinks.providers[link.labelKey],
                  )}
                >
                  <span>{t.admin.billingLinks.openUsage}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              </Button>
              {"secondaryHref" in link && link.secondaryHref ? (
                <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground" asChild>
                  <a
                    href={link.secondaryHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.admin.billingLinks.openLink.replace(
                      "{provider}",
                      t.admin.billingLinks.providers.googleBilling,
                    )}
                  >
                    <span>{t.admin.billingLinks.providers.googleBilling}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </div>
          </AdminDashboardCard>
        ))}
      </div>
    </div>
  );
}
