import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always", // /en/... and /ar/...
  // RTL direction is handled in layout via `dir` attribute
});
