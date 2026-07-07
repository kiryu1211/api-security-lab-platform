export type AdminInvitationRequest = {
  actorUserId: string;
  targetEmailAlias: "analyst.demo" | "owner.demo";
  requestedRole: "learner" | "reviewer" | "admin";
};

type DemoActor = {
  id: string;
  role: "learner" | "reviewer" | "admin";
  permissions: string[];
};

const adminInvitationFeature = "admin:invitations:create";

const demoActors: DemoActor[] = [
  {
    id: "user-demo-alice",
    role: "learner",
    permissions: ["orders:read"],
  },
  {
    id: "user-demo-bob",
    role: "reviewer",
    permissions: ["orders:read", "reports:review"],
  },
  {
    id: "user-demo-admin",
    role: "admin",
    permissions: ["orders:read", "admin:read", adminInvitationFeature],
  },
];

function findActor(actorUserId: string) {
  return demoActors.find((actor) => actor.id === actorUserId);
}

function buildInvitationPreview(request: AdminInvitationRequest) {
  return {
    invitationId: `invite-demo-${request.targetEmailAlias.replace(".", "-")}`,
    targetEmailAlias: request.targetEmailAlias,
    requestedRole: request.requestedRole,
    emailSent: false,
    accountCreated: false,
  };
}

export function unsafeCreateAdminInvitation(request: AdminInvitationRequest) {
  const actor = findActor(request.actorUserId);

  return {
    accepted: true,
    actorUserId: request.actorUserId,
    actorRole: actor?.role ?? "unknown-demo-role",
    feature: adminInvitationFeature,
    invitation: buildInvitationPreview(request),
    checks: {
      actorAuthenticated: Boolean(actor),
      functionPermissionChecked: false,
      roleEscalationChecked: false,
      denyByDefaultApplied: false,
    },
    risk: "Administrative invitation function accepted without feature-level authorization.",
  };
}

export function safeCreateAdminInvitation(request: AdminInvitationRequest) {
  const actor = findActor(request.actorUserId);

  if (!actor) {
    return {
      allowed: false,
      reason: "unknown-actor",
      actorUserId: request.actorUserId,
      feature: adminInvitationFeature,
    };
  }

  if (!actor.permissions.includes(adminInvitationFeature)) {
    return {
      allowed: false,
      reason: "missing-feature-permission",
      actorUserId: actor.id,
      actorRole: actor.role,
      requiredPermission: adminInvitationFeature,
    };
  }

  if (request.requestedRole === "admin" && actor.role !== "admin") {
    return {
      allowed: false,
      reason: "role-escalation-denied",
      actorUserId: actor.id,
      actorRole: actor.role,
      requestedRole: request.requestedRole,
    };
  }

  return {
    allowed: true,
    authorization: {
      actorUserId: actor.id,
      actorRole: actor.role,
      requiredPermission: adminInvitationFeature,
      functionPermissionChecked: true,
      roleEscalationChecked: true,
      denyByDefaultApplied: true,
    },
    invitation: buildInvitationPreview(request),
  };
}
