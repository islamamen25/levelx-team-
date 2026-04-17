import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all page routes — exclude API routes, _next, static files
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
