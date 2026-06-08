import type { Metadata } from "next";

import { HomePage } from "@/components/pages/home-page";
import { getServerLocale, getServerMessages } from "@/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  const locale = await getServerLocale();
  return createPageMetadata({
    title: t.seo.home.title,
    description: t.seo.home.description,
    path: "/",
    locale,
  });
}

export default function Page() {
  return <HomePage />;
}
