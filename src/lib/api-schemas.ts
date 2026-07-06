import { z } from "zod";

export const labUserIdSchema = z
  .string()
  .regex(/^user-demo-[a-z-]+$/, "Use one of the local demo user IDs.");

export const labResourceIdSchema = z
  .string()
  .regex(
    /^(order|profile|report)-demo-[0-9]{3}$/,
    "Use one of the local demo resource IDs.",
  );

export const labSampleQuerySchema = z.object({
  userId: labUserIdSchema.optional(),
  resourceType: z.enum(["order", "profile", "report"]).optional(),
});

export const orderPathParamsSchema = z.object({
  orderId: labResourceIdSchema.refine((value) => value.startsWith("order-"), {
    message: "Use one of the local demo order IDs.",
  }),
});

export const secureOrderQuerySchema = z.object({
  userId: labUserIdSchema,
});

export const authSessionBodySchema = z.object({
  tokenId: z
    .string()
    .regex(/^demo-token-[a-z-]+$/, "Use one of the local demo token IDs."),
  requiredPermission: z
    .enum(["orders:read", "admin:read"])
    .default("orders:read"),
});

export const rateLimitQuerySchema = z.object({
  userId: labUserIdSchema.default("user-demo-alice"),
  q: z.string().min(1).max(40).default("demo"),
});

export const profileUpdateBodySchema = z.object({
  displayLabel: z.string().min(1).max(80).optional(),
  notificationsEnabled: z.boolean().optional(),
  role: z.enum(["learner", "reviewer"]).optional(),
  ownerId: labUserIdSchema.optional(),
});

export const fetchUrlBodySchema = z.object({
  url: z.string().url(),
});
