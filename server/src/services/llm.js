import { extractJson } from "./planSchema.js";

function weatherLines(forecast) {
  return forecast
    .map(
      (d, i) =>
        `Day ${i + 1} (${d.date}): ${d.tempC}°C, ${d.condition}, rainExpected=${d.rainExpected}`
    )
    .join("\n");
}

export function buildPrompt(trip, coords, forecast) {
  const personal = trip.preferredPlaces || trip.mustSee || "";
  const extra = trip.otherPreferences || trip.notes || "";
  return `You are an adaptive travel planner. Return ONLY valid JSON. No markdown.

The traveler does NOT need to name tourist spots. YOU choose the special places for this destination.
Only force a personal stop if "specificRequest" is non-empty.
Put outdoor activities on dry days. On rainExpected=true days, use indoor plans and set adjustedForWeather=true with a short weatherAdjustment.
Stay within budgetCap. Include an emergency buffer. Costs are estimates in the given currency for ALL travelers combined.

JSON shape:
{
  "summary": "string",
  "travelDna": "The Explorer | The Foodie | The Creator | The Relaxer | The Culture Seeker",
  "weatherNotes": "string",
  "days": [
    {
      "title": "string",
      "adjustedForWeather": false,
      "weatherAdjustment": "",
      "blocks": [
        { "time": "10:00", "title": "string", "kind": "hotel|food|activity|travel|free", "notes": "string", "estimatedCost": 0 }
      ],
      "dayTotal": 0
    }
  ],
  "budget": {
    "estimated": 0,
    "categories": {
      "transportation": 0,
      "accommodation": 0,
      "food": 0,
      "activities": 0,
      "shopping": 0,
      "emergency": 0
    },
    "suggestion": "one saving or allocation tip"
  },
  "activities": [{ "name": "string", "reason": "string", "estimatedCost": 0 }],
  "packing": [
    { "category": "Clothing|Activities|Weather|Electronics", "items": [{ "name": "string", "reason": "string" }] }
  ]
}

days MUST have exactly ${forecast.length} entries in date order.

Trip:
destination: ${trip.destination}
resolvedLocation: ${coords.label}
dates: ${forecast[0].date} to ${forecast[forecast.length - 1].date}
people: ${trip.travelersCount}
budgetCap: ${trip.currency} ${trip.budgetCap}
pace: ${trip.pace}
interests: ${(trip.interests || []).join(", ") || "general"}
diet: ${trip.diet || "veg"}
avoid: ${trip.avoid || "none"}
specificRequest: ${personal || "none — discover highlights yourself"}
other: ${extra || "none"}

Weather:
${weatherLines(forecast)}
`;
}

export async function callLlm(prompt) {
  const key = (
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    ""
  ).trim();
  const provider = (process.env.LLM_PROVIDER || inferProvider()).toLowerCase();

  // #region agent log
  fetch("http://127.0.0.1:7369/ingest/c9f5dc73-89b9-479e-9ca9-c3637fc39ab6", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2092fc" },
    body: JSON.stringify({
      sessionId: "2092fc",
      runId: "post-fix",
      hypothesisId: "H",
      location: "server/src/services/llm.js:callLlm",
      message: "llm_key_and_provider",
      data: {
        keyPresent: Boolean(key),
        keyLength: key.length,
        provider,
        envModel: process.env.LLM_MODEL || "",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!key) {
    const err = new Error("NO_LLM_KEY");
    err.code = "NO_LLM_KEY";
    throw err;
  }

  if (provider === "openai") {
    return callOpenAi(prompt, key);
  }
  return callGemini(prompt, key);
}

function inferProvider() {
  if (process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) return "openai";
  return "gemini";
}

async function callGemini(prompt, key) {
  const models = [
    process.env.LLM_MODEL,
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  let lastError = "Gemini request failed.";
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
      }),
    });
    const data = await res.json();
    // #region agent log
    fetch("http://127.0.0.1:7369/ingest/c9f5dc73-89b9-479e-9ca9-c3637fc39ab6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2092fc" },
      body: JSON.stringify({
        sessionId: "2092fc",
        runId: "post-fix",
        hypothesisId: "H",
        location: "server/src/services/llm.js:callGemini",
        message: "gemini_http_result",
        data: {
          model,
          status: res.status,
          ok: res.ok,
          err: data.error?.message || "",
          hasText: Boolean(data.candidates?.[0]?.content?.parts?.[0]?.text),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!res.ok) {
      lastError = data.error?.message || lastError;
      continue;
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    return extractJson(text);
  }
  throw new Error(lastError);
}

async function callOpenAi(prompt, key) {
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const base = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only valid JSON for a travel plan." },
        { role: "user", content: prompt },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "OpenAI request failed.");
  }
  return extractJson(data.choices?.[0]?.message?.content || "");
}
