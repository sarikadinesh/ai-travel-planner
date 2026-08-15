import { dayCount } from "./dates.js";

const DNA = {
  adventure: "The Explorer",
  nature: "The Explorer",
  food: "The Foodie",
  beaches: "The Relaxer",
  wellness: "The Relaxer",
  heritage: "The Culture Seeker",
  shopping: "The Creator",
  nightlife: "The Creator",
};

function pickDna(interests) {
  for (const id of interests || []) {
    if (DNA[id]) return DNA[id];
  }
  return "The Relaxer";
}

function outdoorBlock(trip, hour, cost) {
  const interest = (trip.interests || [])[0] || "sights";
  const map = {
    beaches: "Beach time and shoreline walk",
    adventure: "Adventure activity (water sports or trek)",
    nature: "Nature trail or viewpoint",
    nightlife: "Sunset spot before nightlife",
    food: "Outdoor cafe and local snack crawl",
    heritage: "Old town walking circuit",
    shopping: "Open-air market",
    wellness: "Garden or spa garden stroll",
  };
  return {
    time: hour,
    title: map[interest] || "Signature outdoor highlight",
    kind: "activity",
    notes: `AI pick for ${trip.destination} (${interest}).`,
    estimatedCost: cost,
  };
}

function indoorBlock(hour, cost) {
  return {
    time: hour,
    title: "Museum / indoor food hall / covered market",
    kind: "activity",
    notes: "Swapped from outdoor because of rain.",
    estimatedCost: cost,
  };
}

export function buildFallbackPlan(trip, forecast) {
  const people = trip.travelersCount || 1;
  const daysN = forecast.length || dayCount(trip.startDate, trip.endDate);
  const stay = Math.round(trip.budgetCap * 0.32);
  const food = Math.round(trip.budgetCap * 0.22);
  const activities = Math.round(trip.budgetCap * 0.18);
  const transport = Math.round(trip.budgetCap * 0.12);
  const shopping = Math.round(trip.budgetCap * 0.08);
  const emergency = Math.max(
    0,
    trip.budgetCap - (stay + food + activities + transport + shopping)
  );
  const perDayActivity = Math.round(activities / daysN);
  const perDayFood = Math.round(food / daysN);

  const days = forecast.map((wx, i) => {
    const rain = wx.rainExpected;
    const blocks = [
      {
        time: "10:00",
        title: i === 0 ? "Hotel check-in / drop bags" : "Easy start at the stay",
        kind: "hotel",
        notes: "",
        estimatedCost: i === 0 ? Math.round(stay / daysN) : 0,
      },
      {
        time: "12:30",
        title: trip.diet === "nonveg" ? "Local lunch" : "Vegetarian local lunch",
        kind: "food",
        notes: "",
        estimatedCost: Math.round(perDayFood * 0.45),
      },
      rain ? indoorBlock("15:00", perDayActivity) : outdoorBlock(trip, "15:00", perDayActivity),
      {
        time: "19:00",
        title: rain ? "Covered cafe dinner" : "Dinner and evening stroll",
        kind: "food",
        notes: (trip.interests || []).includes("nightlife") && !rain ? "Nightlife after dinner if energy allows." : "",
        estimatedCost: Math.round(perDayFood * 0.55),
      },
    ];
    return {
      title: `Day ${i + 1} in ${trip.destination}`,
      adjustedForWeather: rain,
      weatherAdjustment: rain
        ? `Your outdoor plan for Day ${i + 1} was moved indoors because of ${wx.condition.toLowerCase()}.`
        : "",
      blocks,
      dayTotal: blocks.reduce((s, b) => s + b.estimatedCost, 0),
    };
  });

  const rainDays = forecast.filter((d) => d.rainExpected);
  return {
    summary: `A ${trip.pace} ${daysN}-day plan for ${people} in ${trip.destination}, shaped by your interests and the forecast.`,
    travelDna: pickDna(trip.interests),
    weatherNotes: rainDays.length
      ? `Rain likely on ${rainDays.map((d) => d.date).join(", ")}. Those days are indoor-first.`
      : "Mostly outdoor-friendly weather across the trip.",
    days,
    budget: {
      estimated: stay + food + activities + transport + shopping + emergency,
      categories: {
        transportation: transport,
        accommodation: stay,
        food,
        activities,
        shopping,
        emergency,
      },
      suggestion:
        stay / trip.budgetCap > 0.35
          ? "Accommodation is a large share. A mid-range stay could free money for activities."
          : "Budget has an emergency buffer. Keep paid activities on dry days.",
    },
    activities: (trip.interests || ["sights"]).slice(0, 5).map((name) => ({
      name: `Best-of ${name} in ${trip.destination}`,
      reason: "Matched to your interests; exact venues chosen by the planner.",
      estimatedCost: Math.round(perDayActivity * 0.8),
    })),
    packing: [
      {
        category: "Clothing",
        items: [
          { name: `${Math.min(daysN + 1, 7)} comfortable outfits`, reason: "Trip length" },
          { name: "Light layer / jacket", reason: "Evenings" },
        ],
      },
      {
        category: "Activities",
        items: (trip.interests || []).includes("beaches")
          ? [
              { name: "Swimwear", reason: "Beach days" },
              { name: "Quick-dry towel", reason: "Water activities" },
            ]
          : [{ name: "Walking shoes", reason: "Day exploring" }],
      },
      {
        category: "Weather",
        items: rainDays.length
          ? [
              { name: "Umbrella", reason: "Rain days" },
              { name: "Light rain jacket", reason: "Forecast" },
            ]
          : [{ name: "Sunscreen", reason: "Daytime sun" }],
      },
      {
        category: "Electronics",
        items: [
          { name: "Charger", reason: "Daily use" },
          { name: "Power bank", reason: "Full days out" },
        ],
      },
    ],
  };
}
