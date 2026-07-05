import { NextResponse } from "next/server";
import { getLabRuntimeSafety } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    routeType: "secure",
    safety: getLabRuntimeSafety(),
  });
}
