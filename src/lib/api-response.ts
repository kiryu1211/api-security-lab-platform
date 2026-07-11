import { NextResponse } from "next/server";

export type ApiRouteType = "secure" | "vulnerable";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "VULNERABLE_API_DISABLED"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "FORBIDDEN";

export type ApiMeta = {
  routeType: ApiRouteType;
  localOnly?: boolean;
};

function apiResponseInit(init?: ResponseInit): ResponseInit {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");

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
