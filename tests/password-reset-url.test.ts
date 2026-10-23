import { describe, expect, it } from "vitest";
import { buildPasswordResetUrl, PasswordResetUrlError } from "@/lib/password-reset-url";

describe("buildPasswordResetUrl", () => {
  it("uses the configured public origin and URL-encodes the token", () => {
    const result = buildPasswordResetUrl("https://school.example/some/path", "token+with/slash", true);
    const url = new URL(result);
    expect(url.origin).toBe("https://school.example");
    expect(url.pathname).toBe("/admin/reset-password");
    expect(url.searchParams.get("token")).toBe("token+with/slash");
  });

  it("rejects a localhost reset-link origin in production", () => {
    expect(() => buildPasswordResetUrl("http://localhost:3000", "token", true))
      .toThrowError(new PasswordResetUrlError("AUTH_URL_MUST_USE_HTTPS"));
    expect(() => buildPasswordResetUrl("https://localhost:3000", "token", true))
      .toThrowError(new PasswordResetUrlError("AUTH_URL_MUST_NOT_BE_LOCAL"));
  });

  it("rejects HTTP origins in production", () => {
    expect(() => buildPasswordResetUrl("http://school.example", "token", true))
      .toThrowError(new PasswordResetUrlError("AUTH_URL_MUST_USE_HTTPS"));
  });

  it("reports missing and malformed configuration clearly", () => {
    expect(() => buildPasswordResetUrl(undefined, "token", true))
      .toThrowError(new PasswordResetUrlError("AUTH_URL_MISSING"));
    expect(() => buildPasswordResetUrl("not a URL", "token", true))
      .toThrowError(new PasswordResetUrlError("AUTH_URL_INVALID"));
  });

  it("allows a localhost URL for local development", () => {
    expect(buildPasswordResetUrl("http://localhost:3000", "token", false))
      .toBe("http://localhost:3000/admin/reset-password?token=token");
  });
});
