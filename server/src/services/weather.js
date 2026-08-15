import { addDays, dayCount, isoDate, weatherLabel } from "./dates.js";

export async function fetchForecast({ lat, lon, startDate, endDate }) {
  const days = dayCount(startDate, endDate);
  const start = isoDate(startDate);
  const end = isoDate(endDate);

  const primary = await requestDaily(lat, lon, start, end);
  if (primary.length >= days) {
    return primary.slice(0, days);
  }

  const today = isoDate(new Date());
  const fallbackEnd = addDays(today, 15);
  const nearby = await requestDaily(lat, lon, today, fallbackEnd);
  if (!nearby.length) {
    return Array.from({ length: days }, (_, i) => ({
      date: addDays(startDate, i),
      tempC: 28,
      precipitationProb: 20,
      weatherCode: 1,
      condition: "Typical seasonal weather",
      rainExpected: false,
      fromFallback: true,
    }));
  }

  return Array.from({ length: days }, (_, i) => {
    const src = nearby[Math.min(i, nearby.length - 1)];
    return {
      ...src,
      date: addDays(startDate, i),
      fromFallback: true,
    };
  });
}

async function requestDaily(lat, lon, start, end) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", "weather_code,temperature_2m_max,precipitation_probability_max");
  url.searchParams.set("start_date", start);
  url.searchParams.set("end_date", end);
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url, {
    headers: { "User-Agent": "ai-travel-planner" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const times = data.daily?.time || [];
  return times.map((date, i) => {
    const code = Number(data.daily.weather_code?.[i] ?? 1);
    const tempC = Math.round(Number(data.daily.temperature_2m_max?.[i] ?? 28));
    const precipitationProb = Number(data.daily.precipitation_probability_max?.[i] ?? 0);
    const { condition, rainExpected } = weatherLabel(code, precipitationProb);
    return {
      date,
      tempC,
      precipitationProb,
      weatherCode: code,
      condition,
      rainExpected,
      fromFallback: false,
    };
  });
}
