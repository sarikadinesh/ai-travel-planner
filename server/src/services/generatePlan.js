import { geocodeDestination } from "./geocode.js";
import { fetchForecast } from "./weather.js";
import { buildPrompt, callLlm } from "./llm.js";
import { validatePlan } from "./planSchema.js";
import { buildFallbackPlan } from "./fallbackPlan.js";

export async function generateTripPlan(trip) {
  const coords = await geocodeDestination(trip.destination);
  const forecast = await fetchForecast({
    lat: coords.lat,
    lon: coords.lon,
    startDate: trip.startDate,
    endDate: trip.endDate,
  });

  let raw;
  let source = "llm";
  let llmError = "";
  try {
    raw = await callLlm(buildPrompt(trip, coords, forecast));
  } catch (err) {
    llmError = err.message || "LLM failed";
    // #region agent log
    fetch("http://127.0.0.1:7369/ingest/c9f5dc73-89b9-479e-9ca9-c3637fc39ab6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2092fc" },
      body: JSON.stringify({
        sessionId: "2092fc",
        runId: "post-fix",
        hypothesisId: "H",
        location: "server/src/services/generatePlan.js:catch",
        message: "llm_failed_using_fallback",
        data: { code: err.code || "", errMessage: llmError.slice(0, 200) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (err.code !== "NO_LLM_KEY") {
      try {
        raw = await callLlm(buildPrompt(trip, coords, forecast));
        llmError = "";
      } catch (retryErr) {
        console.warn("LLM failed, using weather-aware fallback:", retryErr.message);
        raw = buildFallbackPlan(trip, forecast);
        source = "fallback";
        llmError = retryErr.message || llmError;
      }
    } else {
      raw = buildFallbackPlan(trip, forecast);
      source = "fallback";
    }
  }

  const plan = validatePlan(raw, trip, forecast);
  return { coords, forecast, plan, source, llmError };
}
