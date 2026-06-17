'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    if (isSignup) {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      setLoading(false);

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (data?.session) {
        router.push('/map');
        router.refresh();
      } else {
        setNotice('Check your inbox to confirm your email, then sign in.');
      }
      return;
    }

    const { error: signinError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signinError) {
      setError(signinError.message);
      return;
    }

    router.push('/map');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink/80 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink/80 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          placeholder="At least 6 characters"
        />
      </div>

      {error && (
        <p className="text-sm text-gold-dark bg-gold-dark/10 border border-gold-dark/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {notice && (
        <p className="text-sm text-teal-dark bg-teal/10 border border-teal/30 rounded-md px-3 py-2">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-navy text-parchment font-medium py-2.5 hover:bg-navy-deep transition-colors disabled:opacity-60"
      >
        {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
      </button>
    </form>
  );
}
