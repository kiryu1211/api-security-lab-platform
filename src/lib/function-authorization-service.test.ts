import { describe, expect, it } from "vitest";
import {
  safeCreateAdminInvitation,
  unsafeCreateAdminInvitation,
} from "./function-authorization-service";

const learnerAdminInvite = {
  actorUserId: "user-demo-alice",
  targetEmailAlias: "analyst.demo" as const,
  requestedRole: "admin" as const,
};

describe("function-authorization-service", () => {
  it("shows the vulnerable flow accepting admin functions from a learner", () => {
    const result = unsafeCreateAdminInvitation(learnerAdminInvite);

    expect(result.accepted).toBe(true);
    expect(result.actorRole).toBe("learner");
    expect(result.checks.functionPermissionChecked).toBe(false);
    expect(result.invitation.emailSent).toBe(false);
  });

  it("rejects admin functions when the actor lacks feature permission", () => {
    const result = safeCreateAdminInvitation(learnerAdminInvite);

    expect(result).toMatchObject({
      allowed: false,
      reason: "missing-feature-permission",
      actorRole: "learner",
      requiredPermission: "admin:invitations:create",
    });
  });

  it("allows an admin actor after feature-level authorization", () => {
    const result = safeCreateAdminInvitation({
      actorUserId: "user-demo-admin",
      targetEmailAlias: "analyst.demo",
      requestedRole: "reviewer",
    });

    expect(result).toMatchObject({
      allowed: true,
      authorization: {
        actorRole: "admin",
        functionPermissionChecked: true,
        roleEscalationChecked: true,
        denyByDefaultApplied: true,
      },
      invitation: {
        requestedRole: "reviewer",
        emailSent: false,
        accountCreated: false,
      },
    });
  });
});
