export type DemoPermission = "orders:read" | "admin:read";

export type DemoToken = {
  id: string;
  subjectUserId: string;
  signatureState: "valid" | "invalid";
  expiresAtEpochMs: number;
  revoked: boolean;
  permissions: DemoPermission[];
};

export const demoTokens: DemoToken[] = [
  {
    id: "demo-token-valid-reader",
    subjectUserId: "user-demo-alice",
    signatureState: "valid",
    expiresAtEpochMs: 4102444800000,
    revoked: false,
    permissions: ["orders:read"],
  },
  {
    id: "demo-token-expired-admin",
    subjectUserId: "user-demo-bob",
    signatureState: "invalid",
    expiresAtEpochMs: 946684800000,
    revoked: true,
    permissions: ["orders:read", "admin:read"],
  },
  {
    id: "demo-token-limited-reader",
    subjectUserId: "user-demo-reviewer",
    signatureState: "valid",
    expiresAtEpochMs: 4102444800000,
    revoked: false,
    permissions: ["orders:read"],
  },
];

export function findDemoToken(tokenId: string) {
  return demoTokens.find((token) => token.id === tokenId);
}
