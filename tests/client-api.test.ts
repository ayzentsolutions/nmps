import { describe, expect, it } from "vitest";
import { readApiResponse } from "@/lib/client-api";

describe("readApiResponse", () => {
  it("parses a JSON API response", async () => {
    const response = new Response(JSON.stringify({ data: { id: "asset-1" } }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" }
    });

    await expect(readApiResponse(response)).resolves.toEqual({ data: { id: "asset-1" } });
  });

  it("returns a clear status-aware message for a non-JSON error response", async () => {
    const response = new Response("Request Endpoint Error", {
      status: 502,
      statusText: "Bad Gateway",
      headers: { "content-type": "text/plain; charset=utf-8" }
    });

    await expect(readApiResponse(response)).rejects.toThrow(
      "Request failed (HTTP 502 Bad Gateway). The server returned a non-JSON error; check the deployment logs and service configuration."
    );
  });

  it("does not treat a successful non-JSON response as valid API data", async () => {
    const response = new Response("<html>ok</html>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" }
    });

    await expect(readApiResponse(response)).rejects.toThrow(
      "The server returned an unexpected non-JSON response. Refresh the page and try again."
    );
  });

  it("reports malformed JSON without exposing parser internals", async () => {
    const response = new Response("{ broken", {
      status: 500,
      headers: { "content-type": "application/json" }
    });

    await expect(readApiResponse(response)).rejects.toThrow(
      "The server returned an invalid JSON response. Refresh the page and try again."
    );
  });
});
