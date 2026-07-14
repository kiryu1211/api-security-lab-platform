import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  secureRouteMeta,
  vulnerableRouteMeta,
} from "@/lib/api-response";
import { isPublicShowcase } from "@/lib/env";

function createNonce() {
  return btoa(crypto.randomUUID());
}

function createContentSecurityPolicy(nonce: string) {
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
  ].join(" ");

  return `default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src ${scriptSources}; script-src-attr 'none'; style-src 'self' 'unsafe-inline'`;
}

export function middleware(request: NextRequest) {
  const apiRequest =
    request.nextUrl.pathname === "/api" ||
    request.nextUrl.pathname.startsWith("/api/");

  if (apiRequest && !isPublicShowcase()) {
    return NextResponse.next();
  }

  if (apiRequest) {
    const vulnerable =
      request.nextUrl.pathname === "/api/vulnerable" ||
      request.nextUrl.pathname.startsWith("/api/vulnerable/");

    return apiError(
      403,
      "PUBLIC_SHOWCASE_API_DISABLED",
      "Live API execution is disabled in the public showcase. Run API demos only in the local lab.",
      vulnerable ? vulnerableRouteMeta() : secureRouteMeta(),
    );
  }

  const nonce = createNonce();
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
