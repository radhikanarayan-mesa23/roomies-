// Nominatim geocoding. Max 1 request/sec per their usage policy. Never
// guesses coordinates - a failed or ambiguous lookup returns null and the
// UI shows "not confirmed" for anything that depends on it.

let lastCallAt = 0;

async function throttle() {
  const elapsed = Date.now() - lastCallAt;
  const waitMs = Math.max(0, 1000 - elapsed);
  if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
  lastCallAt = Date.now();
}

export async function geocodePlace(
  place: string
): Promise<{ lat: number; lng: number } | null> {
  if (!place || !place.trim()) return null;
  await throttle();

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    `${place}, Pune`
  )}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Roomiess/1.0" },
    });
    if (!res.ok) return null;
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}
