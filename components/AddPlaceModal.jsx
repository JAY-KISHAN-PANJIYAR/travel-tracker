'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { COUNTRIES, findCountryByName } from '@/lib/countries';
import { getContinent } from '@/lib/continents';

const STAR_LABELS = ['','Meh','Okay','Good','Great','Amazing'];

const emptyForm = {
  country: '',
  state: '',
  city: '',
  latitude: null,
  longitude: null,
  visitedOn: '',
  notes: '',
  rating: 0,
  status: 'visited',
  tripName: '',
};

export default function AddPlaceModal({ onClose, onAdded, editPlace }) {
  const supabase = createClient();
  const isEdit = !!editPlace;

  const [form, setForm] = useState(editPlace ? {
    country: editPlace.country_name || '',
    state: editPlace.state_name || '',
    city: editPlace.city_name || '',
    latitude: editPlace.latitude,
    longitude: editPlace.longitude,
    visitedOn: editPlace.visited_on || '',
    notes: editPlace.notes || '',
    rating: editPlace.rating || 0,
    status: editPlace.status || 'visited',
    tripName: editPlace.trip_name || '',
  } : emptyForm);

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setError("Couldn't reach place search. Fill in the fields manually.");
    } finally {
      setSearching(false);
    }
  }

  function pickResult(r) {
    setForm((prev) => ({
      ...prev,
      country: r.country || prev.country,
      state: r.state || prev.state,
      city: r.city || prev.city,
      latitude: r.lat,
      longitude: r.lon,
    }));
    setResults([]);
    setSearch('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const country = findCountryByName(form.country);
    if (!country) { setError('Pick a country from the list.'); return; }
    if (!form.city.trim()) { setError('City is required.'); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user.id,
      country_code: country.code,
      country_name: country.name,
      continent: getContinent(country.code),
      state_name: form.state.trim() || null,
      city_name: form.city.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      visited_on: form.visitedOn || null,
      notes: form.notes.trim() || null,
      rating: form.rating || null,
      status: form.status,
      trip_name: form.tripName.trim() || null,
    };

    let dbError;
    if (isEdit) {
      const { error: upErr } = await supabase.from('places').update(payload).eq('id', editPlace.id);
      dbError = upErr;
    } else {
      const { error: insErr } = await supabase.from('places').insert(payload);
      dbError = insErr;
    }

    setSaving(false);

    if (dbError) {
      if (dbError.code === '23505') setError("You've already added that city for this trip.");
      else setError(dbError.message);
      return;
    }

    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-parchment rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10 sticky top-0 bg-parchment z-10">
          <h2 className="font-display text-xl text-ink">{isEdit ? 'Edit place' : 'Add a place'}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink/70 text-xl leading-none">✕</button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 px-6 pt-4">
          {[['visited','✈️ Visited'],['wishlist','⭐ Wishlist']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => update('status', val)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium border transition-all ${
                form.status === val
                  ? 'bg-navy text-parchment border-navy'
                  : 'bg-white text-ink/60 border-ink/15 hover:border-ink/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <form onSubmit={handleSearch} className="flex gap-2 mb-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search a city, e.g. "Tokyo, Japan"'
              className="flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-lg bg-teal text-parchment text-sm px-4 py-2 hover:bg-teal-dark transition-colors disabled:opacity-60"
            >
              {searching ? '…' : 'Find'}
            </button>
          </form>
          <p className="text-xs text-ink/40 mb-3">Optional — auto-fills fields and places a pin on the map.</p>

          {results.length > 0 && (
            <ul className="mb-3 rounded-lg border border-ink/10 divide-y divide-ink/10 overflow-hidden text-sm">
              {results.map((r, i) => (
                <li key={i}>
                  <button type="button" onClick={() => pickResult(r)} className="w-full text-left px-3 py-2 hover:bg-gold/10">
                    {r.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Country */}
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1 uppercase tracking-wide">Country *</label>
            <input
              list="country-options"
              value={form.country}
              onChange={e => update('country', e.target.value)}
              required
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
              placeholder="Start typing a country…"
            />
            <datalist id="country-options">
              {COUNTRIES.map(c => <option key={c.code} value={c.name} />)}
            </datalist>
          </div>

          {/* State + City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink/60 mb-1 uppercase tracking-wide">State / Province</label>
              <input
                value={form.state}
                onChange={e => update('state', e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink/60 mb-1 uppercase tracking-wide">City *</label>
              <input
                value={form.city}
                onChange={e => update('city', e.target.value)}
                required
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Date + Trip */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink/60 mb-1 uppercase tracking-wide">
                {form.status === 'wishlist' ? 'Target date' : 'Date visited'}
              </label>
              <input
                type="date"
                value={form.visitedOn}
                onChange={e => update('visitedOn', e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink/60 mb-1 uppercase tracking-wide">Trip name</label>
              <input
                value={form.tripName}
                onChange={e => update('tripName', e.target.value)}
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder="e.g. Europe 2024"
              />
            </div>
          </div>

          {/* Rating (visited only) */}
          {form.status === 'visited' && (
            <div>
              <label className="block text-xs font-semibold text-ink/60 mb-2 uppercase tracking-wide">Rating</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update('rating', form.rating === n ? 0 : n)}
                    title={STAR_LABELS[n]}
                    className={`text-2xl transition-transform hover:scale-110 ${form.rating >= n ? 'opacity-100' : 'opacity-20'}`}
                  >
                    ⭐
                  </button>
                ))}
                {form.rating > 0 && (
                  <span className="ml-2 text-sm text-ink/50 self-center">{STAR_LABELS[form.rating]}</span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1 uppercase tracking-wide">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none resize-none"
              placeholder="Memories, tips, highlights…"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-ink/15 text-ink/70 text-sm py-2.5 hover:bg-ink/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-navy text-parchment text-sm py-2.5 hover:bg-navy-deep transition-colors disabled:opacity-60 font-medium">
              {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Add place')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
