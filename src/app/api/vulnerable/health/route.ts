import { NextResponse } from "next/server";
import { assertVulnerableApisEnabled } from "@/lib/env";

export function GET() {
  const guard = assertVulnerableApisEnabled();

  if (!guard.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: guard.message,
        safety: guard.safety,
      },
      { status: guard.status },
    );
  }

  return NextResponse.json({
    ok: true,
    routeType: "vulnerable",
    warning: "Local-only vulnerable API route. Do not expose publicly.",
    safety: guard.safety,
  });
}
