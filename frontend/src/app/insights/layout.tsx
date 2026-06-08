import type { Metadata } from "next";

import { getServerLocale, getServerMessages } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  const locale = await getServerLocale();
  return createPageMetadata({
    title: t.seo.insights.title,
    description: t.seo.insights.description,
    path: "/insights",
    locale,
  });
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
