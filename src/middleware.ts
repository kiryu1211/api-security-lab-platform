import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  secureRouteMeta,
  vulnerableRouteMeta,
} from "@/lib/api-response";
import { isPublicShowcase } from "@/lib/env";

export function middleware(request: NextRequest) {
  if (!isPublicShowcase()) {
    return NextResponse.next();
  }

  const vulnerable = request.nextUrl.pathname.startsWith("/api/vulnerable/");

  return apiError(
    403,
    "PUBLIC_SHOWCASE_API_DISABLED",
    "Live API execution is disabled in the public showcase. Run API demos only in the local lab.",
    vulnerable ? vulnerableRouteMeta() : secureRouteMeta(),
  );
}

export const config = {
  matcher: "/api/:path*",
};
