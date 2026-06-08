import type { Metadata } from "next";

import { getServerLocale, getServerMessages } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  const locale = await getServerLocale();
  return createPageMetadata({
    title: t.seo.models.title,
    description: t.seo.models.description,
    path: "/models",
    locale,
  });
}

export default function ModelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
