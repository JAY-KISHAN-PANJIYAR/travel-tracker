'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Navbar({ email }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-navy-deep border-b border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-xl">🌍</span>
        <span className="font-display text-lg text-parchment font-semibold tracking-tight">Atlas</span>
      </div>

      <div className="flex items-center gap-3">
        {email && (
          <span className="text-parchment/50 text-xs hidden sm:inline truncate max-w-[160px]">{email}</span>
        )}
        <button
          onClick={signOut}
          className="text-xs text-parchment/60 hover:text-parchment border border-white/15 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
