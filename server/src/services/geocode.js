export async function geocodeDestination(destination) {
  const nominatim = await geocodeNominatim(destination);
  if (nominatim) return nominatim;

  const meteo = await geocodeOpenMeteo(destination);
  if (meteo) return meteo;

  throw new Error("Destination not found. Try a city or region, e.g. Goa, India.");
}

async function geocodeNominatim(destination) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", destination);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": "ai-travel-planner/1.0 (local demo)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const hit = data?.[0];
  if (!hit) return null;
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    label: hit.display_name || destination,
  };
}

async function geocodeOpenMeteo(destination) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", destination);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { "User-Agent": "ai-travel-planner" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const hits = data.results || [];
  if (!hits.length) return null;

  const q = destination.toLowerCase().split(",")[0].trim();
  hits.sort((a, b) => scoreHit(b, q) - scoreHit(a, q));
  const hit = hits[0];
  const parts = [hit.name, hit.admin1, hit.country].filter(Boolean);
  return {
    lat: hit.latitude,
    lon: hit.longitude,
    label: parts.join(", "),
  };
}

function scoreHit(hit, q) {
  const name = String(hit.name || "").toLowerCase();
  let s = 0;
  if (name === q) s += 100;
  else if (name.startsWith(q)) s += 20;
  if (hit.country_code === "IN") s += 15;
  if (hit.population) s += Math.min(20, Math.log10(hit.population + 1) * 4);
  if (q === "goa" && name === "genoa") s -= 100;
  return s;
}
