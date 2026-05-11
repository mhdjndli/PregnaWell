import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "ar"] as const;
const DEFAULT_LOCALE = "en";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bare root → default locale.
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    return NextResponse.redirect(url);
  }

  // Pass the resolved pathname to the root layout so it can set <html lang/dir>
  // before the body renders. (No reliable way to read the request URL from a
  // server component otherwise.)
  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  // Skip Next internals, the API routes, the admin (English-only), and static files.
  matcher: ["/((?!_next|api|admin|favicon.ico|robots.txt|sitemap.xml|assets).*)"],
};

export const ALL_LOCALES = LOCALES;
