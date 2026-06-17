'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import Stats from '@/components/Stats';
import PlaceTree from '@/components/PlaceTree';
import AddPlaceModal from '@/components/AddPlaceModal';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-ink/40 text-sm">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', place }
  const [mobileView, setMobileView] = useState('map');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const refreshPlaces = useCallback(async () => {
    const { data } = await supabase
      .from('places')
      .select('*')
      .order('visited_on', { ascending: false, nullsLast: true });
    setPlaces(data || []);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setEmail(user.email || '');
      await refreshPlaces();
      setLoading(false);
    })();
  }, [supabase, router, refreshPlaces]);

  async function handleDelete(place) {
    if (!confirm(`Remove ${place.city_name}?`)) return;
    const { error } = await supabase.from('places').delete().eq('id', place.id);
    if (!error) setPlaces(prev => prev.filter(p => p.id !== place.id));
  }

  async function handleAdded() {
    setModal(null);
    await refreshPlaces();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-ink/50">
        <div className="text-4xl animate-pulse">🌍</div>
        <div className="text-sm">Loading your atlas…</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar email={email} />
      <Stats places={places} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80 lg:w-96' : 'w-0'} transition-all duration-300 overflow-hidden shrink-0 hidden md:flex flex-col border-r border-ink/10 bg-parchment-dim h-full`}>
          {sidebarOpen && (
            <PlaceTree
              places={places}
              onDelete={handleDelete}
              onEdit={place => setModal({ mode: 'edit', place })}
              onAddClick={() => setModal({ mode: 'add' })}
            />
          )}
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-[900] bg-white border border-ink/15 shadow-md rounded-r-lg px-1 py-3 text-ink/40 hover:text-ink/70 transition-colors"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          style={{ left: sidebarOpen ? (window?.innerWidth >= 1024 ? '24rem' : '20rem') : '0' }}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        {/* Mobile list */}
        <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:hidden w-full flex-col bg-parchment-dim h-full overflow-hidden`}>
          <PlaceTree
            places={places}
            onDelete={handleDelete}
            onEdit={place => setModal({ mode: 'edit', place })}
            onAddClick={() => setModal({ mode: 'add' })}
          />
        </div>

        {/* Map */}
        <div className={`${mobileView === 'map' ? 'block' : 'hidden'} md:block flex-1 h-full relative overflow-hidden`}>
          <MapView places={places} />
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileView(v => v === 'map' ? 'list' : 'map')}
          className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-navy text-parchment text-sm font-semibold px-6 py-3 shadow-xl"
        >
          {mobileView === 'map' ? '📋 Show list' : '🗺️ Show map'}
        </button>
      </div>

      {modal?.mode === 'add' && (
        <AddPlaceModal onClose={() => setModal(null)} onAdded={handleAdded} />
      )}
      {modal?.mode === 'edit' && (
        <AddPlaceModal onClose={() => setModal(null)} onAdded={handleAdded} editPlace={modal.place} />
      )}
    </div>
  );
}
