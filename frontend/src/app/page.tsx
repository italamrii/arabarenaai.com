import type { Metadata } from "next";

import { HomePage } from "@/components/pages/home-page";
import { ar } from "@/i18n/ar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: ar.seo.home.title,
  description: ar.seo.home.description,
  path: "/",
});

export default function Page() {
  return <HomePage />;
}
