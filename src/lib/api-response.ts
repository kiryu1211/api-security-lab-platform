import { NextResponse } from "next/server";

export type ApiRouteType = "secure" | "vulnerable";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "VULNERABLE_API_DISABLED"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN";

type ApiMeta = {
  routeType: ApiRouteType;
  localOnly?: boolean;
};

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
    init,
  );
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  meta: ApiMeta,
  details?: unknown,
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
    { status },
  );
}

export function vulnerableRouteMeta(): ApiMeta {
  return { routeType: "vulnerable", localOnly: true };
}

export function secureRouteMeta(): ApiMeta {
  return { routeType: "secure" };
}
