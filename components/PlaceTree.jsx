'use client';

import { useMemo, useState } from 'react';

const UNSPECIFIED = 'Unspecified region';
const STAR = '⭐';

function buildTree(places) {
  const byCountry = new Map();
  for (const place of places) {
    if (!byCountry.has(place.country_code)) {
      byCountry.set(place.country_code, {
        name: place.country_name,
        code: place.country_code,
        continent: place.continent || 'Other',
        states: new Map(),
      });
    }
    const country = byCountry.get(place.country_code);
    const stateKey = place.state_name?.trim() || UNSPECIFIED;
    if (!country.states.has(stateKey)) country.states.set(stateKey, []);
    country.states.get(stateKey).push(place);
  }
  return [...byCountry.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function matches(text, q) { return text.toLowerCase().includes(q); }

export default function PlaceTree({ places, onDelete, onEdit, onAddClick }) {
  const [query, setQuery] = useState('');
  const [openKeys, setOpenKeys] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all' | 'visited' | 'wishlist'

  const filtered = useMemo(() =>
    places.filter(p => filter === 'all' || p.status === filter),
    [places, filter]
  );

  const tree = useMemo(() => buildTree(filtered), [filtered]);
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  function isCountryMatch(c) {
    if (!searching) return true;
    if (matches(c.name, q)) return true;
    for (const [sn, cities] of c.states) {
      if (matches(sn, q) || cities.some(ci => matches(ci.city_name, q))) return true;
    }
    return false;
  }

  function isStateMatch(country, sn, cities) {
    if (!searching) return true;
    return matches(country.name, q) || matches(sn, q) || cities.some(ci => matches(ci.city_name, q));
  }

  function toggle(key, open) {
    if (searching) return;
    setOpenKeys(prev => {
      const next = new Set(prev);
      open ? next.add(key) : next.delete(key);
      return next;
    });
  }

  const visitedCount = places.filter(p => p.status === 'visited').length;
  const wishlistCount = places.filter(p => p.status === 'wishlist').length;

  return (
    <div className="flex flex-col h-full">
      {/* Top controls */}
      <div className="p-3 border-b border-ink/10 space-y-2">
        <button
          onClick={onAddClick}
          className="w-full rounded-lg bg-gold text-navy-deep font-semibold text-sm py-2.5 hover:bg-gold-light transition-colors shadow-sm"
        >
          + Add a place
        </button>

        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search countries, cities…"
          className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />

        {/* Filter tabs */}
        <div className="flex rounded-lg border border-ink/10 overflow-hidden text-xs">
          {[['all', `All (${places.length})`], ['visited', `Visited (${visitedCount})`], ['wishlist', `Wishlist (${wishlistCount})`]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`flex-1 py-1.5 transition-colors ${
                filter === val ? 'bg-navy text-parchment font-medium' : 'text-ink/60 hover:bg-ink/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 && (
          <p className="text-sm text-ink/50 px-3 py-8 text-center">
            {filter === 'wishlist'
              ? 'No wishlist places yet. Add somewhere you dream of visiting!'
              : 'No places yet. Start adding cities you\'ve explored!'}
          </p>
        )}

        {filtered.length > 0 && tree.filter(isCountryMatch).length === 0 && (
          <p className="text-sm text-ink/50 px-3 py-8 text-center">No matches for "{query}"</p>
        )}

        {tree.filter(isCountryMatch).map(country => {
          const ck = `c:${country.code}`;
          const cityCount = [...country.states.values()].reduce((s, a) => s + a.length, 0);
          return (
            <details
              key={ck}
              open={searching || openKeys.has(ck)}
              onToggle={e => toggle(ck, e.target.open)}
              className="mb-1 group/country"
            >
              <summary className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-ink/5 text-sm font-semibold select-none">
                <svg className="chevron w-3 h-3 text-ink/40 shrink-0 transition-transform" viewBox="0 0 8 8" fill="currentColor">
                  <path d="M1 0l6 4-6 4z" />
                </svg>
                <span className="truncate">{country.name}</span>
                {country.continent && (
                  <span className="text-[10px] text-ink/30 font-normal shrink-0">{country.continent}</span>
                )}
                <span className="ml-auto font-mono text-xs text-ink/40 shrink-0">{cityCount}</span>
              </summary>

              <div className="ml-4 mt-0.5 border-l border-ink/10 pl-2">
                {[...country.states.entries()]
                  .filter(([sn, cities]) => isStateMatch(country, sn, cities))
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([sn, cities]) => {
                    const sk = `s:${country.code}:${sn}`;
                    return (
                      <details
                        key={sk}
                        open={searching || openKeys.has(sk)}
                        onToggle={e => toggle(sk, e.target.open)}
                        className="mb-0.5"
                      >
                        <summary className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-ink/5 text-sm text-ink/75 select-none">
                          <svg className="chevron w-2.5 h-2.5 text-ink/35 shrink-0" viewBox="0 0 8 8" fill="currentColor">
                            <path d="M1 0l6 4-6 4z" />
                          </svg>
                          <span className="truncate">{sn}</span>
                          <span className="ml-auto font-mono text-xs text-ink/35 shrink-0">{cities.length}</span>
                        </summary>

                        <ul className="ml-4 border-l border-ink/10 pl-2">
                          {cities
                            .filter(c => !searching || matches(c.city_name, q) || matches(country.name, q) || matches(sn, q))
                            .sort((a, b) => a.city_name.localeCompare(b.city_name))
                            .map(place => (
                              <li key={place.id} className="group flex items-center gap-1.5 px-2 py-1.5 text-sm text-ink/70 rounded-lg hover:bg-ink/5">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${place.status === 'wishlist' ? 'bg-gold border border-gold-dark' : 'bg-teal'}`} />
                                <span className="truncate flex-1">{place.city_name}</span>

                                <div className="flex items-center gap-1 shrink-0">
                                  {place.rating > 0 && (
                                    <span className="text-[10px] text-ink/35">{STAR.repeat(place.rating)}</span>
                                  )}
                                  {place.visited_on && (
                                    <span className="font-mono text-[10px] text-ink/30 hidden group-hover:inline">
                                      {place.visited_on}
                                    </span>
                                  )}
                                  {place.trip_name && (
                                    <span className="text-[10px] text-gold-dark/60 hidden group-hover:inline truncate max-w-[60px]" title={place.trip_name}>
                                      {place.trip_name}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => onEdit(place)}
                                    aria-label={`Edit ${place.city_name}`}
                                    className="opacity-0 group-hover:opacity-100 text-ink/40 hover:text-navy text-xs ml-0.5"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={() => onDelete(place)}
                                    aria-label={`Remove ${place.city_name}`}
                                    className="opacity-0 group-hover:opacity-100 text-ink/40 hover:text-red-500 text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </details>
                    );
                  })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
