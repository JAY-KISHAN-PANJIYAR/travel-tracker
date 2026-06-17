'use client';

import { useMemo } from 'react';
import { CONTINENTS } from '@/lib/continents';

function countDistinct(places, keyFn) {
  const set = new Set();
  for (const p of places) {
    const key = keyFn(p);
    if (key) set.add(key);
  }
  return set.size;
}

export default function Stats({ places }) {
  const visited = useMemo(() => places.filter(p => p.status !== 'wishlist'), [places]);
  const wishlist = useMemo(() => places.filter(p => p.status === 'wishlist'), [places]);

  const stats = useMemo(() => {
    const countries = countDistinct(visited, p => p.country_code);
    const states = countDistinct(visited, p => p.state_name ? `${p.country_code}|${p.state_name.trim().toLowerCase()}` : null);
    const cities = countDistinct(visited, p => `${p.country_code}|${p.state_name||''}|${p.city_name}`);
    const continents = countDistinct(visited, p => p.continent);
    const trips = countDistinct(visited, p => p.trip_name || null);

    // Most visited country
    const countryCount = {};
    for (const p of visited) {
      countryCount[p.country_name] = (countryCount[p.country_name] || 0) + 1;
    }
    const topCountry = Object.entries(countryCount).sort((a,b) => b[1]-a[1])[0];

    // Latest visit
    const withDates = visited.filter(p => p.visited_on).sort((a,b) => b.visited_on.localeCompare(a.visited_on));
    const latest = withDates[0];

    // Continent breakdown
    const contBreakdown = {};
    for (const p of visited) {
      const c = p.continent || 'Other';
      if (!contBreakdown[c]) contBreakdown[c] = new Set();
      contBreakdown[c].add(p.country_code);
    }

    return { countries, states, cities, continents, trips, topCountry, latest, contBreakdown, wishlistCount: wishlist.length };
  }, [visited, wishlist]);

  const mainTiles = [
    { label: 'Countries', value: stats.countries, icon: '🌍' },
    { label: 'States / Regions', value: stats.states, icon: '🗺️' },
    { label: 'Cities', value: stats.cities, icon: '🏙️' },
    { label: 'Continents', value: stats.continents, icon: '🧭' },
  ];

  if (stats.trips > 0) {
    mainTiles.push({ label: 'Trips', value: stats.trips, icon: '✈️' });
  }
  if (stats.wishlistCount > 0) {
    mainTiles.push({ label: 'Wishlist', value: stats.wishlistCount, icon: '⭐' });
  }

  return (
    <div className="bg-navy-deep border-b border-white/10">
      {/* Main stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 divide-x divide-white/10">
        {mainTiles.map((tile) => (
          <div key={tile.label} className="px-4 py-3 text-center">
            <div className="text-lg mb-0.5">{tile.icon}</div>
            <div className="font-mono text-2xl text-gold-light leading-none font-bold">
              {String(tile.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-parchment/50 mt-1">
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      {/* Secondary info bar */}
      {(stats.topCountry || stats.latest) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 border-t border-white/5 text-xs text-parchment/50">
          {stats.topCountry && (
            <span>
              <span className="text-parchment/30 mr-1">Most visited:</span>
              <span className="text-gold-light/80">{stats.topCountry[0]}</span>
              <span className="text-parchment/30 ml-1">({stats.topCountry[1]} {stats.topCountry[1] === 1 ? 'city' : 'cities'})</span>
            </span>
          )}
          {stats.latest && (
            <span>
              <span className="text-parchment/30 mr-1">Latest:</span>
              <span className="text-gold-light/80">{stats.latest.city_name}, {stats.latest.country_name}</span>
              <span className="text-parchment/30 ml-1">({stats.latest.visited_on})</span>
            </span>
          )}
        </div>
      )}

      {/* Continent progress bar */}
      {stats.continents > 0 && (
        <div className="px-4 pb-2 pt-1 border-t border-white/5">
          <div className="flex gap-1 items-center">
            {['Africa','Asia','Europe','North America','Oceania','South America'].map(cont => {
              const count = stats.contBreakdown[cont]?.size || 0;
              const active = count > 0;
              return (
                <div key={cont} className="flex-1 group relative">
                  <div className={`h-1.5 rounded-full transition-all ${active ? 'bg-gold' : 'bg-white/10'}`} />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden group-hover:block bg-navy text-parchment text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                    {cont}{active ? ` · ${count}` : ''} {active ? (count === 1 ? 'country' : 'countries') : '(not yet)'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-parchment/30 mt-1">{stats.continents}/6 continents explored</div>
        </div>
      )}
    </div>
  );
}
