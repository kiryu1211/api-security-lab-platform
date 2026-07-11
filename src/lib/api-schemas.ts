import { z } from "zod";

export const labUserIdSchema = z.enum(
  ["user-demo-alice", "user-demo-bob", "user-demo-reviewer", "user-demo-admin"],
  { error: "Use one of the local demo user IDs." },
);

export const labResourceIdSchema = z
  .string()
  .regex(
    /^(order|profile|report)-demo-[0-9]{3}$/,
    "Use one of the local demo resource IDs.",
  );

export const labSampleQuerySchema = z
  .object({
    userId: labUserIdSchema.optional(),
    resourceType: z.enum(["order", "profile", "report"]).optional(),
  })
  .strict();

export const orderPathParamsSchema = z
  .object({
    orderId: labResourceIdSchema.refine((value) => value.startsWith("order-"), {
      message: "Use one of the local demo order IDs.",
    }),
  })
  .strict();

export const secureOrderQuerySchema = z
  .object({
    userId: labUserIdSchema,
  })
  .strict();

export const authSessionBodySchema = z
  .object({
    tokenId: z
      .string()
      .regex(/^demo-token-[a-z-]+$/, "Use one of the local demo token IDs."),
    requiredPermission: z
      .enum(["orders:read", "admin:read"])
      .default("orders:read"),
  })
  .strict();

export const adminInvitationBodySchema = z
  .object({
    actorUserId: labUserIdSchema.default("user-demo-alice"),
    targetEmailAlias: z.enum(["analyst.demo", "owner.demo"]),
    requestedRole: z.enum(["learner", "reviewer", "admin"]),
  })
  .strict();

export const rateLimitQuerySchema = z
  .object({
    userId: labUserIdSchema.default("user-demo-alice"),
    q: z.string().min(1).max(40).default("demo"),
  })
  .strict();

export const profileUpdateBodySchema = z.object({
  displayLabel: z.string().min(1).max(80).optional(),
  notificationsEnabled: z.boolean().optional(),
  role: z.enum(["learner", "reviewer"]).optional(),
  ownerId: labUserIdSchema.optional(),
});

export const fetchUrlBodySchema = z
  .object({
    url: z.string().url(),
  })
  .strict();

export const securityConfigAuditBodySchema = z
  .object({
    requestedOrigin: z.enum([
      "https://lab.example.test",
      "https://untrusted.example",
    ]),
    includeDebugDetails: z.boolean().default(true),
  })
  .strict();

export const businessFlowReservationBodySchema = z
  .object({
    userId: labUserIdSchema.default("user-demo-alice"),
    productId: z
      .string()
      .regex(
        /^product-demo-[0-9]{3}$/,
        "Use one of the local demo product IDs.",
      ),
    quantity: z.number().int().min(1).max(10),
    flowStep: z.enum(["cart-confirmed", "direct-checkout"]),
  })
  .strict();

export const thirdPartyProfileImportBodySchema = z
  .object({
    providerResponseId: z.enum([
      "partner-response-safe-profile",
      "partner-response-redirect-admin",
    ]),
    expectedProvider: z.enum(["trusted-profile-service"]),
  })
  .strict();

export const apiInventoryOperationBodySchema = z
  .object({
    endpointId: z.enum(["legacy-token-reset-v1", "current-token-reset-v2"]),
    requestedEnvironment: z.enum(["production", "staging", "development"]),
  })
  .strict();
