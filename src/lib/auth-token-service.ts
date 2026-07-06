import {
  findDemoToken,
  type DemoPermission,
  type DemoToken,
} from "@/data/auth-samples";

export type AuthSessionResult =
  | { ok: true; token: DemoToken; acceptedChecks: string[] }
  | {
      ok: false;
      reason:
        | "not-found"
        | "invalid-signature"
        | "expired"
        | "revoked"
        | "missing-permission";
    };

export function createWeakSession(tokenId: string): AuthSessionResult {
  const token = findDemoToken(tokenId);

  if (!token) {
    return { ok: false, reason: "not-found" };
  }

  return {
    ok: true,
    token,
    acceptedChecks: ["token-id-present"],
  };
}

export function createVerifiedSession(
  tokenId: string,
  requiredPermission: DemoPermission,
  nowEpochMs = Date.now(),
): AuthSessionResult {
  const token = findDemoToken(tokenId);

  if (!token) {
    return { ok: false, reason: "not-found" };
  }

  if (token.signatureState !== "valid") {
    return { ok: false, reason: "invalid-signature" };
  }

  if (token.expiresAtEpochMs <= nowEpochMs) {
    return { ok: false, reason: "expired" };
  }

  if (token.revoked) {
    return { ok: false, reason: "revoked" };
  }

  if (!token.permissions.includes(requiredPermission)) {
    return { ok: false, reason: "missing-permission" };
  }

  return {
    ok: true,
    token,
    acceptedChecks: ["signature", "expiration", "revocation", "permission"],
  };
}

export function toSessionResponse(
  result: Extract<AuthSessionResult, { ok: true }>,
) {
  return {
    subjectUserId: result.token.subjectUserId,
    permissions: result.token.permissions,
    acceptedChecks: result.acceptedChecks,
    tokenDiagnostics: {
      tokenId: result.token.id,
      signatureState: result.token.signatureState,
      expired: result.token.expiresAtEpochMs <= Date.now(),
      revoked: result.token.revoked,
    },
  };
}

export function authFailureStatus(
  reason: Exclude<AuthSessionResult, { ok: true }>["reason"],
) {
  if (reason === "missing-permission") {
    return 403;
  }

  if (reason === "not-found") {
    return 404;
  }

  return 401;
}
