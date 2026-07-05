export type LabUser = {
  id: string;
  displayName: string;
  role: "learner" | "reviewer";
};

export type LabResource = {
  id: string;
  ownerId: string;
  resourceType: "order" | "profile" | "report";
  data: Record<string, string | number | boolean>;
};

export const labUsers: LabUser[] = [
  {
    id: "user-demo-alice",
    displayName: "Demo User A",
    role: "learner",
  },
  {
    id: "user-demo-bob",
    displayName: "Demo User B",
    role: "learner",
  },
  {
    id: "user-demo-reviewer",
    displayName: "Demo Reviewer",
    role: "reviewer",
  },
];

export const labResources: LabResource[] = [
  {
    id: "order-demo-001",
    ownerId: "user-demo-alice",
    resourceType: "order",
    data: {
      itemLabel: "training-api-plan",
      amount: 1200,
      status: "draft",
    },
  },
  {
    id: "order-demo-002",
    ownerId: "user-demo-bob",
    resourceType: "order",
    data: {
      itemLabel: "lab-verification-plan",
      amount: 1800,
      status: "review",
    },
  },
  {
    id: "profile-demo-001",
    ownerId: "user-demo-alice",
    resourceType: "profile",
    data: {
      displayLabel: "sample-learner-profile",
      notificationsEnabled: true,
      roleEditableByUser: false,
    },
  },
];

export function findLabResource(resourceId: string) {
  return labResources.find((resource) => resource.id === resourceId);
}

export function findLabUser(userId: string) {
  return labUsers.find((user) => user.id === userId);
}
