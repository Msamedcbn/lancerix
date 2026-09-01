import { describe, expect, it } from "vitest";

import { criterionDraftSchema } from "@/lib/validations/acceptance-criteria";

const parse = (input: unknown) => criterionDraftSchema.safeParse(input);

describe("criterionDraftSchema", () => {
  it("accepts a valid description", () => {
    expect(parse({ description: "Ana sayfa açılır ve hata vermez." }).success).toBe(true);
  });

  it("rejects a description that is too short", () => {
    expect(parse({ description: "ok" }).success).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(parse({ description: "" }).success).toBe(false);
  });

  it("rejects a missing description", () => {
    expect(parse({}).success).toBe(false);
  });
});

