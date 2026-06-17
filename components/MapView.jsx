'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import {
  WORLD_MAP_URL,
  stateMapUrl,
  normalizeName,
  getFeatureName,
  fetchJsonCached,
} from '@/lib/geo';

const COLORS = {
  visited: { fill: '#D9933D', border: '#B5541F' },
  wishlist: { fill: '#6366f1', border: '#4f46e5' },
  state: { fill: '#1F6B6B', border: '#154E4E' },
  neutral: '#9fb3ad',
};

const STAR_LABELS = ['','★','★★','★★★','★★★★','★★★★★'];

export default function MapView({ places, onCityClick }) {
  const [worldGeo, setWorldGeo] = useState(null);
  const [countryGeo, setCountryGeo] = useState({});
  const loadedCodes = useRef(new Set());
  const [mapStyle, setMapStyle] = useState('standard');

  useEffect(() => {
    fetchJsonCached(WORLD_MAP_URL).then(setWorldGeo);
  }, []);

  const visitedPlaces = useMemo(() => places.filter(p => p.status !== 'wishlist'), [places]);
  const wishlistPlaces = useMemo(() => places.filter(p => p.status === 'wishlist'), [places]);

  const visitedCountryCodes = useMemo(() => [...new Set(visitedPlaces.map(p => p.country_code))], [visitedPlaces]);
  const wishlistCountryCodes = useMemo(() => [...new Set(wishlistPlaces.map(p => p.country_code).filter(c => !visitedPlaces.find(p => p.country_code === c)))], [wishlistPlaces, visitedPlaces]);
  const allCountryCodes = useMemo(() => [...new Set(places.map(p => p.country_code))], [places]);

  const visitedCountryNames = useMemo(() => new Set(visitedPlaces.map(p => normalizeName(p.country_name))), [visitedPlaces]);
  const wishlistCountryNames = useMemo(() => new Set(wishlistPlaces.map(p => normalizeName(p.country_name)).filter(n => !visitedCountryNames.has(n))), [wishlistPlaces, visitedCountryNames]);

  const visitedStatesByCountry = useMemo(() => {
    const map = new Map();
    for (const p of visitedPlaces) {
      if (!p.state_name) continue;
      if (!map.has(p.country_code)) map.set(p.country_code, new Set());
      map.get(p.country_code).add(normalizeName(p.state_name));
    }
    return map;
  }, [visitedPlaces]);

  useEffect(() => {
    allCountryCodes.forEach(async (code) => {
      if (loadedCodes.current.has(code)) return;
      loadedCodes.current.add(code);
      const data = await fetchJsonCached(stateMapUrl(code));
      if (data) setCountryGeo(prev => ({ ...prev, [code]: data }));
    });
  }, [allCountryCodes]);

  function styleCountry(feature) {
    const name = normalizeName(getFeatureName(feature));
    const isVisited = visitedCountryNames.has(name);
    const isWishlist = wishlistCountryNames.has(name);
    if (isVisited) return { fillColor: COLORS.visited.fill, fillOpacity: 0.55, color: COLORS.visited.border, weight: 1 };
    if (isWishlist) return { fillColor: COLORS.wishlist.fill, fillOpacity: 0.35, color: COLORS.wishlist.border, weight: 1 };
    return { fillColor: 'transparent', fillOpacity: 0, color: COLORS.neutral, weight: 0.5 };
  }

  const TILE_LAYERS = {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  const TILE_ATTR = {
    standard: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    dark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    satellite: '&copy; Esri',
  };

  const worldKey = [...visitedCountryNames, ...wishlistCountryNames].sort().join(',');
  const cityPlaces = places.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={2}
        worldCopyJump
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer attribution={TILE_ATTR[mapStyle]} url={TILE_LAYERS[mapStyle]} />

        {worldGeo && (
          <GeoJSON
            key={`world-${worldKey}`}
            data={worldGeo}
            style={styleCountry}
            onEachFeature={(feature, layer) => {
              const name = getFeatureName(feature);
              if (name) layer.bindTooltip(name, { sticky: true, opacity: 0.85 });
            }}
          />
        )}

        {allCountryCodes.map(code => {
          const data = countryGeo[code];
          if (!data) return null;
          const visitedStates = visitedStatesByCountry.get(code) || new Set();
          const stateKey = `state-${code}-${[...visitedStates].sort().join(',')}`;
          return (
            <GeoJSON
              key={stateKey}
              data={data}
              style={feature => {
                const name = normalizeName(getFeatureName(feature));
                const visited = visitedStates.has(name);
                return {
                  fillColor: visited ? COLORS.state.fill : COLORS.visited.fill,
                  fillOpacity: visited ? 0.55 : 0.08,
                  color: visited ? COLORS.state.border : COLORS.visited.border,
                  weight: visited ? 1 : 0.4,
                };
              }}
              onEachFeature={(feature, layer) => {
                const name = getFeatureName(feature);
                if (name) layer.bindTooltip(name, { sticky: true, opacity: 0.85 });
              }}
            />
          );
        })}

        {cityPlaces.map(p => (
          <CircleMarker
            key={p.id}
            center={[p.latitude, p.longitude]}
            radius={p.status === 'wishlist' ? 5 : 6}
            pathOptions={{
              fillColor: p.status === 'wishlist' ? COLORS.wishlist.fill : COLORS.visited.fill,
              color: '#ffffff',
              weight: 1.5,
              fillOpacity: 0.9,
            }}
            eventHandlers={onCityClick ? { click: () => onCityClick(p) } : {}}
          >
            <Popup maxWidth={260}>
              <div className="text-sm">
                <div className="font-bold text-base">{p.city_name}</div>
                <div className="text-ink/60 text-xs mt-0.5">
                  {[p.state_name, p.country_name].filter(Boolean).join(', ')}
                </div>
                {p.status === 'wishlist' && (
                  <div className="mt-1.5 inline-block text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">⭐ Wishlist</div>
                )}
                {p.rating > 0 && (
                  <div className="mt-1 text-gold-dark text-sm">{STAR_LABELS[p.rating]}</div>
                )}
                {p.trip_name && (
                  <div className="mt-1 text-xs text-ink/50">✈️ {p.trip_name}</div>
                )}
                {p.visited_on && (
                  <div className="mt-1 text-xs text-ink/50 font-mono">{p.visited_on}</div>
                )}
                {p.notes && (
                  <p className="mt-1.5 text-xs text-ink/70 border-t border-ink/10 pt-1.5 leading-relaxed">{p.notes}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Map style switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-white/90 backdrop-blur rounded-lg shadow-md p-1">
        {[['standard','🗺️'],['dark','🌑'],['satellite','🛰️']].map(([style, icon]) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            title={style.charAt(0).toUpperCase() + style.slice(1)}
            className={`px-2 py-1 rounded-md text-sm transition-colors ${
              mapStyle === style ? 'bg-navy text-white' : 'text-ink/60 hover:bg-ink/10'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-3 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{background:'#D9933D', opacity:0.7}} />
          <span className="text-ink/70">Visited country</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{background:'#1F6B6B', opacity:0.7}} />
          <span className="text-ink/70">Visited state</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{background:'#6366f1', opacity:0.5}} />
          <span className="text-ink/70">Wishlist</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{background:'#D9933D'}} />
          <span className="text-ink/70">City pin</span>
        </div>
      </div>
    </div>
  );
}
