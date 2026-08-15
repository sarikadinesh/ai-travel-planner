export function dayCount(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function isoDate(value) {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(startDate, offset) {
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return isoDate(d);
}

export function weatherLabel(code, precipProb) {
  const rain = Number(precipProb) >= 50 || (code >= 51 && code <= 67) || code >= 80;
  if (code >= 95) return { condition: "Thunderstorms", rainExpected: true };
  if (code >= 80 || (code >= 51 && code <= 67)) {
    return { condition: "Rain", rainExpected: true };
  }
  if (code >= 71 && code <= 77) return { condition: "Snow", rainExpected: false };
  if (code >= 45 && code <= 48) return { condition: "Fog", rainExpected: false };
  if (code >= 2) return { condition: rain ? "Cloudy, rain likely" : "Cloudy", rainExpected: rain };
  return { condition: rain ? "Clear, rain possible" : "Sunny", rainExpected: rain };
}
