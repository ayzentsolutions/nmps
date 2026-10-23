/**
 * Read an API response without leaking raw HTML/error pages into client-side JSON
 * parsing errors. API error payloads remain available to callers for their normal
 * response.ok and body.error handling.
 */
export async function readApiResponse<T = ReturnType<typeof JSON.parse>>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("json")) {
    const status = `HTTP ${response.status}${response.statusText ? " " + response.statusText : ""}`;
    throw new Error(
      response.ok
        ? "The server returned an unexpected non-JSON response. Refresh the page and try again."
        : `Request failed (${status}). The server returned a non-JSON error; check the deployment logs and service configuration.`
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("The server returned an invalid JSON response. Refresh the page and try again.");
  }
}
