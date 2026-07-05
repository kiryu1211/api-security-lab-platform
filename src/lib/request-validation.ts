import { z } from "zod";

export type ValidationResult<TValue> =
  { ok: true; value: TValue } | { ok: false; issues: z.ZodIssue[] };

export function validateWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
): ValidationResult<z.infer<TSchema>> {
  const result = schema.safeParse(value);

  if (!result.success) {
    return { ok: false, issues: result.error.issues };
  }

  return { ok: true, value: result.data };
}

export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries());
}

export async function readJsonBody(request: Request): Promise<unknown> {
  if (!request.body) {
    return {};
  }

  return request.json();
}
