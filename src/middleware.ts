import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  secureRouteMeta,
  vulnerableRouteMeta,
} from "@/lib/api-response";
import { isPublicShowcase } from "@/lib/env";

const HSTS_HEADER_VALUE = "max-age=31536000";

function createNonce() {
  return btoa(crypto.randomUUID());
}

function createContentSecurityPolicy(nonce: string) {
  const development = process.env.NODE_ENV === "development";
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(development ? ["'unsafe-eval'"] : []),
  ].join(" ");
  const styleSources = development
    ? "'self' 'unsafe-inline'"
    : `'self' 'nonce-${nonce}'`;
  const styleAttributes = development ? "'unsafe-inline'" : "'none'";

  return `default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src ${scriptSources}; script-src-attr 'none'; style-src ${styleSources}; style-src-attr ${styleAttributes}`;
}

function isLoopbackHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
}

function applyTransportSecurity(response: NextResponse, request: NextRequest) {
  if (
    request.nextUrl.protocol === "https:" &&
    !isLoopbackHostname(request.nextUrl.hostname)
  ) {
    response.headers.set("Strict-Transport-Security", HSTS_HEADER_VALUE);
  }

  return response;
}

function isStaticAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    ["/favicon.ico", "/icon.svg", "/robots.txt", "/sitemap.xml"].includes(
      pathname,
    )
  );
}

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.protocol === "http:" &&
    !isLoopbackHostname(request.nextUrl.hostname)
  ) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = "https:";
    return NextResponse.redirect(secureUrl, 308);
  }

  if (isStaticAssetPath(request.nextUrl.pathname)) {
    return applyTransportSecurity(NextResponse.next(), request);
  }

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

    return applyTransportSecurity(
      apiError(
        403,
        "PUBLIC_SHOWCASE_API_DISABLED",
        "Live API execution is disabled in the public showcase. Run API demos only in the local lab.",
        vulnerable ? vulnerableRouteMeta() : secureRouteMeta(),
      ),
      request,
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

  return applyTransportSecurity(response, request);
}

export const config = {
  matcher: "/:path*",
};
