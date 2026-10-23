export type PasswordResetUrlErrorCode =
  | "AUTH_URL_MISSING"
  | "AUTH_URL_INVALID"
  | "AUTH_URL_MUST_USE_HTTPS"
  | "AUTH_URL_MUST_NOT_BE_LOCAL";

export class PasswordResetUrlError extends Error {
  constructor(readonly code: PasswordResetUrlErrorCode) {
    super(code);
    this.name = "PasswordResetUrlError";
  }
}

export function buildPasswordResetUrl(
  configuredBaseUrl: string | undefined,
  token: string,
  production = process.env.NODE_ENV === "production"
): string {
  const value = configuredBaseUrl?.trim();
  if (!value) throw new PasswordResetUrlError("AUTH_URL_MISSING");

  let base: URL;
  try {
    base = new URL(value);
  } catch {
    throw new PasswordResetUrlError("AUTH_URL_INVALID");
  }

  if ((base.protocol !== "https:" && production) || !["http:", "https:"].includes(base.protocol)) {
    throw new PasswordResetUrlError("AUTH_URL_MUST_USE_HTTPS");
  }

  const hostname = base.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const localHosts = new Set([
    "localhost",
    "localhost.localdomain",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
    "host.docker.internal"
  ]);
  if (
    production &&
    (localHosts.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local"))
  ) {
    throw new PasswordResetUrlError("AUTH_URL_MUST_NOT_BE_LOCAL");
  }

  if (base.username || base.password || !base.hostname) {
    throw new PasswordResetUrlError("AUTH_URL_INVALID");
  }

  const url = new URL("/admin/reset-password", base.origin);
  url.searchParams.set("token", token);
  return url.toString();
}
