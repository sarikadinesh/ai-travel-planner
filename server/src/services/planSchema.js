const CATEGORIES = [
  "transportation",
  "accommodation",
  "food",
  "activities",
  "shopping",
  "emergency",
];

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value, fallback = "") {
  return String(value ?? fallback).trim() || fallback;
}

export function extractJson(text) {
  const raw = String(text || "");
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("The AI did not return JSON.");
  }
  return JSON.parse(body.slice(start, end + 1));
}

export function validatePlan(raw, trip, forecast) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid plan payload.");
  }

  const daysIn = Array.isArray(raw.days) ? raw.days : [];
  const days = forecast.map((wx, i) => {
    const src = daysIn[i] || {};
    const blocks = (Array.isArray(src.blocks) ? src.blocks : []).slice(0, 8).map((b) => ({
      time: asString(b.time, "10:00"),
      title: asString(b.title, "Free time"),
      kind: asString(b.kind, "activity"),
      notes: asString(b.notes, ""),
      estimatedCost: Math.max(0, asNumber(b.estimatedCost, 0)),
    }));
    if (!blocks.length) {
      blocks.push({
        time: "10:00",
        title: wx.rainExpected ? "Indoor exploration" : "Explore the area",
        kind: "activity",
        notes: "",
        estimatedCost: 0,
      });
    }
    const dayTotal = blocks.reduce((sum, b) => sum + b.estimatedCost, 0);
    return {
      date: wx.date,
      title: asString(src.title, `Day ${i + 1}`),
      weather: {
        tempC: wx.tempC,
        condition: wx.condition,
        rainExpected: wx.rainExpected,
      },
      adjustedForWeather: Boolean(src.adjustedForWeather) || wx.rainExpected,
      weatherAdjustment: asString(
        src.weatherAdjustment,
        wx.rainExpected
          ? "Outdoor plans moved indoors because of rain."
          : ""
      ),
      blocks,
      dayTotal: asNumber(src.dayTotal, dayTotal),
    };
  });

  const catsIn = raw.budget?.categories || {};
  const categories = {};
  for (const key of CATEGORIES) {
    categories[key] = Math.max(0, asNumber(catsIn[key], 0));
  }
  let estimated = asNumber(raw.budget?.estimated, 0);
  const catSum = Object.values(categories).reduce((a, b) => a + b, 0);
  if (!estimated) estimated = catSum;
  const cap = trip.budgetCap;
  const remaining = cap - estimated;

  const activities = (Array.isArray(raw.activities) ? raw.activities : [])
    .slice(0, 12)
    .map((a) => ({
      name: asString(a.name, "Local experience"),
      reason: asString(a.reason, ""),
      estimatedCost: Math.max(0, asNumber(a.estimatedCost, 0)),
    }));

  const packing = (Array.isArray(raw.packing) ? raw.packing : []).map((group) => ({
    category: asString(group.category, "General"),
    items: (Array.isArray(group.items) ? group.items : []).map((item) => {
      if (typeof item === "string") {
        return { name: item, reason: "", packed: false };
      }
      return {
        name: asString(item.name, "Item"),
        reason: asString(item.reason, ""),
        packed: false,
      };
    }),
  }));

  if (!packing.length) {
    packing.push({
      category: "Essentials",
      items: [
        { name: "ID and cards", reason: "Travel documents", packed: false },
        { name: "Phone charger", reason: "Daily use", packed: false },
      ],
    });
  }

  return {
    summary: asString(raw.summary, `Personalized plan for ${trip.destination}.`),
    travelDna: asString(raw.travelDna, "Balanced traveler"),
    weatherNotes: asString(raw.weatherNotes, ""),
    days,
    budget: {
      currency: trip.currency,
      cap,
      estimated,
      remaining,
      overBudget: remaining < 0,
      categories,
      suggestion: asString(raw.budget?.suggestion, ""),
    },
    activities,
    packing,
  };
}
