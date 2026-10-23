export type TransactionalEmailCategory =
  | "admission-confirmation"
  | "admissions-notification"
  | "enquiry-confirmation"
  | "enquiry-notification"
  | "password-reset";

type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
  category: TransactionalEmailCategory;
};

export async function sendTransactionalEmail(input: TransactionalEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const to = input.to.trim();
  const missingConfiguration = [
    ...(!apiKey ? ["RESEND_API_KEY"] : []),
    ...(!from ? ["EMAIL_FROM"] : [])
  ];

  if (missingConfiguration.length || !to) {
    console.error("Transactional email is not configured", {
      category: input.category,
      missingConfiguration,
      recipientProvided: Boolean(to)
    });
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "User-Agent": "nmps-school-cms/0.1.0",
        "Idempotency-Key": input.idempotencyKey.slice(0, 256)
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        text: input.text
      })
    });

    if (!response.ok) {
      let providerCode: string | undefined;
      try {
        const providerBody: unknown = await response.json();
        if (providerBody && typeof providerBody === "object" && "name" in providerBody) {
          const name = providerBody.name;
          if (typeof name === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(name)) {
            providerCode = name;
          }
        }
      } catch {
        // Provider responses can be non-JSON; status is still useful for diagnostics.
      }
      console.error("Transactional email provider rejected a message", {
        category: input.category,
        status: response.status,
        ...(providerCode ? { providerCode } : {})
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("Transactional email request failed", {
      category: input.category,
      errorType: error instanceof Error ? error.name : "UnknownError"
    });
    return false;
  }
}
