import { findLabResource } from "@/data/lab-samples";

export type ProfileUpdateInput = {
  displayLabel?: string;
  notificationsEnabled?: boolean;
  role?: "learner" | "reviewer";
  ownerId?: string;
};

export function unsafeProfileUpdate(input: ProfileUpdateInput) {
  const profile = findLabResource("profile-demo-001");

  if (!profile) {
    return undefined;
  }

  return {
    ...profile,
    ownerId: input.ownerId ?? profile.ownerId,
    data: {
      ...profile.data,
      ...input,
    },
  };
}

export function safeProfileUpdate(input: ProfileUpdateInput) {
  const profile = findLabResource("profile-demo-001");

  if (!profile) {
    return undefined;
  }

  return {
    ...profile,
    data: {
      ...profile.data,
      ...(input.displayLabel ? { displayLabel: input.displayLabel } : {}),
      ...(typeof input.notificationsEnabled === "boolean"
        ? { notificationsEnabled: input.notificationsEnabled }
        : {}),
    },
    rejectedProperties: Object.keys(input).filter(
      (key) => key !== "displayLabel" && key !== "notificationsEnabled",
    ),
  };
}
