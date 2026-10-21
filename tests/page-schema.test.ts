import { describe, expect, it } from "vitest";
import { createPageSchema, pageContentSchema } from "@/lib/validations/page";
describe("page schemas", () => {
  it("accepts canonical lowercase slugs", () => expect(createPageSchema.safeParse({ title: "About", slug: "about-the-school" }).success).toBe(true));
  it("rejects path traversal and noncanonical slugs", () => {
    expect(createPageSchema.safeParse({ title: "About", slug: "../admin" }).success).toBe(false);
    expect(createPageSchema.safeParse({ title: "About", slug: "About Us" }).success).toBe(false);
  });
  it("rejects unknown arbitrary content blocks", () => {
    expect(pageContentSchema.safeParse({ blocks: [{ id: "x", type: "script", html: "<script>alert(1)</script>" }] }).success).toBe(false);
  });
  it("enforces a maximum number of blocks", () => {
    expect(pageContentSchema.safeParse({ blocks: Array.from({ length: 101 }, (_, i) => ({ id: String(i), type: "richText", body: "Text" })) }).success).toBe(false);
  });
});