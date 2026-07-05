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
