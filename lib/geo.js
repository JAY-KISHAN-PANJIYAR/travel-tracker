// Free, no-API-key boundary data, served from a public CDN:
//  - WORLD_MAP_URL: every country as one polygon (for the country-level fill)
//  - stateMapUrl(iso2): admin-1 (state/province) polygons for a single country
//
// Source: Highcharts' open map collection (CC-licensed, plain GeoJSON, no
// Highcharts library required). If a given small country/territory doesn't
// have a state-level file, stateMapUrl() will 404 — the app catches that and
// just falls back to the country-level fill for that place.

export const WORLD_MAP_URL = 'https://code.highcharts.com/mapdata/custom/world.geo.json';

export function stateMapUrl(iso2) {
  const cc = iso2.toLowerCase();
  return `https://code.highcharts.com/mapdata/countries/${cc}/${cc}-all.geo.json`;
}

// Strip accents, punctuation, and common filler words so names from
// different datasets ("Republic of Korea" vs "South Korea") are more
// likely to line up.
export function normalizeName(value) {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(the|republic of|state of|province of|county of)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// GeoJSON property names vary by dataset; try the common ones in order.
export function getFeatureName(feature) {
  const props = feature?.properties || {};
  return (
    props.name ||
    props.NAME ||
    props.NAME_1 ||
    props.admin ||
    props.ADMIN ||
    props.NAME_EN ||
    props.woe_name ||
    ''
  );
}

export function getFeatureHcKey(feature) {
  return feature?.properties?.['hc-key'] || '';
}

const cache = new Map();

// Fetches and caches a JSON/GeoJSON resource. Returns null (instead of
// throwing) on any failure, so a missing or unreachable file degrades
// gracefully rather than breaking the map.
export async function fetchJsonCached(url) {
  if (cache.has(url)) return cache.get(url);
  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    })
    .catch((err) => {
      cache.delete(url);
      console.warn('fetchJsonCached failed for', url, err);
      return null;
    });
  cache.set(url, promise);
  return promise;
}
