import { NextResponse } from "next/server";

export type ApiRouteType = "secure" | "vulnerable";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PUBLIC_SHOWCASE_API_DISABLED"
  | "VULNERABLE_API_DISABLED"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "FORBIDDEN";

export type ApiMeta = {
  routeType: ApiRouteType;
  localOnly?: boolean;
};

export const API_CONTENT_SECURITY_POLICY =
  "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
export const API_RESPONSE_SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": API_CONTENT_SECURITY_POLICY,
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;
export const API_CORS_ALLOW_HEADERS = [
  "Access-Control-Allow-Credentials",
  "Access-Control-Allow-Headers",
  "Access-Control-Allow-Methods",
  "Access-Control-Allow-Origin",
  "Access-Control-Allow-Private-Network",
  "Access-Control-Expose-Headers",
  "Access-Control-Max-Age",
] as const;

function apiResponseInit(init?: ResponseInit): ResponseInit {
  const headers = new Headers(init?.headers);
  for (const [name, value] of Object.entries(API_RESPONSE_SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  for (const name of API_CORS_ALLOW_HEADERS) {
    headers.delete(name);
  }

  return { ...init, headers };
}

export function apiSuccess<TData>(
  data: TData,
  meta: ApiMeta,
  init?: ResponseInit,
) {
  return NextResponse.json(
    {
      ok: true,
      data,
      meta,
    },
    apiResponseInit(init),
  );
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  meta: ApiMeta,
  details?: unknown,
  init?: ResponseInit,
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
      meta,
    },
    apiResponseInit({ ...init, status }),
  );
}

export function vulnerableRouteMeta(): ApiMeta {
  return { routeType: "vulnerable", localOnly: true };
}

export function secureRouteMeta(): ApiMeta {
  return { routeType: "secure" };
}
