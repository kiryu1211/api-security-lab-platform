import { describe, expect, it } from "vitest";
import { POST as secureInvitationPost } from "@/app/api/secure/admin/invitations/route";
import { POST as vulnerableInvitationPost } from "@/app/api/vulnerable/admin/invitations/route";

const headers = { "Content-Type": "application/json" };
const body = JSON.stringify({
  actorUserId: "user-demo-alice",
  targetEmailAlias: "analyst.demo",
  requestedRole: "admin",
});

describe("function authorization demo routes", () => {
  it("vulnerable route accepts administrative functions without feature permission", async () => {
    const response = await vulnerableInvitationPost(
      new Request("http://localhost/api/vulnerable/admin/invitations", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.data.invitation.accepted).toBe(true);
    expect(responseBody.data.invitation.checks.functionPermissionChecked).toBe(
      false,
    );
  });

  it("secure route rejects administrative functions without feature permission", async () => {
    const response = await secureInvitationPost(
      new Request("http://localhost/api/secure/admin/invitations", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody.error.details.reason).toBe(
      "missing-feature-permission",
    );
  });
});
