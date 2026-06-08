import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  getMessages,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
  type Messages,
} from "@/i18n/index";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getServerMessages(): Promise<Messages> {
  return getMessages(await getServerLocale());
}
