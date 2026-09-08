import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiCall, setAuthTokenTracker } from "../src/lib/api";

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => "application/json" },
    json: async () => body,
  };
}

describe("apiCall — 401 refresh-and-retry interceptor", () => {
  let tokenUpdater;
  let logoutCallback;

  beforeEach(() => {
    tokenUpdater = vi.fn();
    logoutCallback = vi.fn();
    setAuthTokenTracker(null, tokenUpdater, logoutCallback);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("on a 401, refreshes the token and retries the original request once", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: "expired" })) // original request
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { token: "new-token" } })) // /auth/refresh
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { ok: true } })); // retried request

    const result = await apiCall("GET", "/jobs");

    expect(result).toEqual({ success: true, data: { ok: true } });
    expect(tokenUpdater).toHaveBeenCalledWith("new-token");
    expect(logoutCallback).not.toHaveBeenCalled();

    // Third call is the retry, and it must carry the new token.
    const retryCall = global.fetch.mock.calls[2];
    expect(retryCall[1].headers.Authorization).toBe("Bearer new-token");
  });

  it("logs out and surfaces a session-expired message when the refresh itself fails", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: "expired" }))
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: "invalid refresh token" }));

    const result = await apiCall("GET", "/jobs");

    expect(result).toEqual({ success: false, status: 401, message: "Session expired. Please log in again." });
    expect(logoutCallback).toHaveBeenCalledTimes(1);
  });

  it("logs out when the refresh request itself throws (network failure)", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: "expired" }))
      .mockRejectedValueOnce(new Error("network down"));

    const result = await apiCall("GET", "/jobs");

    expect(result).toEqual({ success: false, status: 401, message: "Network error during token refresh." });
    expect(logoutCallback).toHaveBeenCalledTimes(1);
  });

  it("queues a second concurrent 401'd request behind one in-flight refresh, not two", async () => {
    let resolveRefresh;
    global.fetch.mockImplementation((url, options) => {
      if (url.endsWith("/auth/refresh")) {
        return new Promise((resolve) => {
          resolveRefresh = () => resolve(jsonResponse(200, { success: true, data: { token: "new-token" } }));
        });
      }
      // A retry always carries the refreshed token; anything else is a
      // pre-refresh request and should 401, regardless of which path it is.
      const isRetry = options?.headers?.Authorization === "Bearer new-token";
      if (isRetry) {
        return Promise.resolve(jsonResponse(200, { success: true, data: { retried: url } }));
      }
      return Promise.resolve(jsonResponse(401, { success: false, message: "expired" }));
    });

    const first = apiCall("GET", "/jobs");
    const second = apiCall("GET", "/applications");

    // Let both initial 401s resolve and queue behind the refresh.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const refreshCallCount = global.fetch.mock.calls.filter(([url]) => url.endsWith("/auth/refresh")).length;
    expect(refreshCallCount).toBe(1);

    resolveRefresh();
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(true);
    expect(tokenUpdater).toHaveBeenCalledTimes(1);
  });
});
