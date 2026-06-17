import { NextResponse } from 'next/server';

// Nominatim's usage policy asks for an identifying User-Agent and a max of
// ~1 request/second. Both are easy to satisfy from a personal-use app.
// Replace the contact email below with your own before deploying.
const USER_AGENT = 'travel-tracker-personal-app/1.0 (contact: you@example.com)';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
    q
  )}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: 'Geocoder unavailable' }, { status: 502 });
    }

    const data = await res.json();

    const results = data.map((item) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      country: item.address?.country || '',
      state: item.address?.state || item.address?.region || '',
      city:
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.municipality ||
        item.address?.county ||
        '',
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Geocode error', err);
    return NextResponse.json({ results: [], error: 'Geocoder unavailable' }, { status: 502 });
  }
}
