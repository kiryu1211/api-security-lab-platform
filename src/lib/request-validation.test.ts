import { describe, expect, it } from "vitest";
import { labSampleQuerySchema } from "./api-schemas";
import { searchParamsToObject, validateWithSchema } from "./request-validation";

describe("request validation", () => {
  it("accepts expected lab sample filters", () => {
    const value = searchParamsToObject(
      new URLSearchParams("userId=user-demo-alice&resourceType=order"),
    );

    expect(validateWithSchema(labSampleQuerySchema, value)).toMatchObject({
      ok: true,
      value: {
        userId: "user-demo-alice",
        resourceType: "order",
      },
    });
  });

  it("rejects unexpected lab sample filters", () => {
    const value = searchParamsToObject(
      new URLSearchParams("userId=real-user-1"),
    );

    expect(validateWithSchema(labSampleQuerySchema, value)).toMatchObject({
      ok: false,
    });
  });
});
