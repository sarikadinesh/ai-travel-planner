const TOKEN_KEY = "atp_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = "GET", body, auth = true, timeoutMs = 12000 } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // #region agent log
  fetch("http://127.0.0.1:7369/ingest/c9f5dc73-89b9-479e-9ca9-c3637fc39ab6", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2092fc" },
    body: JSON.stringify({
      sessionId: "2092fc",
      runId: "pre-fix",
      hypothesisId: "B",
      location: "client/src/api.js:api:entry",
      message: "api_call_start",
      data: {
        path,
        method,
        origin: typeof window !== "undefined" ? window.location.origin : "",
        href: typeof window !== "undefined" ? window.location.href : "",
        timeoutMs,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  try {
    const res = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    // #region agent log
    fetch("http://127.0.0.1:7369/ingest/c9f5dc73-89b9-479e-9ca9-c3637fc39ab6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2092fc" },
      body: JSON.stringify({
        sessionId: "2092fc",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "client/src/api.js:api:response",
        message: "api_call_response",
        data: { path, method, status: res.status, ok: res.ok },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Request failed.");
    }
    return data;
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7369/ingest/c9f5dc73-89b9-479e-9ca9-c3637fc39ab6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2092fc" },
      body: JSON.stringify({
        sessionId: "2092fc",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "client/src/api.js:api:catch",
        message: "api_call_failed",
        data: {
          path,
          method,
          name: err?.name,
          errMessage: String(err?.message || err),
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new Error(
      String(err?.message || err).includes("fetch") || err?.name === "TypeError" || err?.name === "AbortError"
        ? "Cannot reach the API. Start the server (port 5050) and use http://127.0.0.1:5173/"
        : err.message
    );
  }
}
