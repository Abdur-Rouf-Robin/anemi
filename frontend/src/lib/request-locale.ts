import { cookies } from "next/headers";

import type { Locale } from "./i18n";

export async function requestLocale(): Promise<Locale> {
  return (await cookies()).get("anemi_locale")?.value === "jp" ? "jp" : "en";
}
