import { afterEach, describe, expect, it, vi } from "vitest";
import { sendTransactionalEmail } from "@/lib/email";

const message = {
  category: "password-reset" as const,
  to: "staff@example.com",
  subject: "Password reset test",
  text: "Synthetic email test.",
  idempotencyKey: "nmps:test:password-reset"
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendTransactionalEmail", () => {
  it("logs missing email configuration without exposing recipient data", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(sendTransactionalEmail(message)).resolves.toBe(false);
    expect(log).toHaveBeenCalledWith("Transactional email is not configured", {
      category: "password-reset",
      missingConfiguration: ["RESEND_API_KEY", "EMAIL_FROM"],
      recipientProvided: true
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(message.to);
  });

  it("posts a transactional message to Resend when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_only");
    vi.stubEnv("EMAIL_FROM", "NMPS <no-reply@example.com>");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email_test_id" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendTransactionalEmail(message)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_only");
    expect(JSON.parse(init.body)).toMatchObject({
      from: "NMPS <no-reply@example.com>",
      to: [message.to],
      subject: message.subject,
      text: message.text
    });
  });

  it("records provider status and safe error code when Resend rejects the message", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_only");
    vi.stubEnv("EMAIL_FROM", "NMPS <no-reply@example.com>");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      name: "validation_error",
      message: "This private provider message must not be logged."
    }), {
      status: 422,
      headers: { "content-type": "application/json" }
    })));

    await expect(sendTransactionalEmail(message)).resolves.toBe(false);
    expect(log).toHaveBeenCalledWith("Transactional email provider rejected a message", {
      category: "password-reset",
      status: 422,
      providerCode: "validation_error"
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(message.to);
    expect(JSON.stringify(log.mock.calls)).not.toContain("private provider message");
  });
});
