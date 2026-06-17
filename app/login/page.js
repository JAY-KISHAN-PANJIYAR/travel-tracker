import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-parchment rounded-xl shadow-card p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark font-mono mb-2">My Atlas</p>
        <h1 className="font-display text-3xl text-ink mb-1">Welcome back</h1>
        <p className="text-sm text-ink/60 mb-6">Sign in to see where you&apos;ve been.</p>

        <AuthForm mode="login" />

        <p className="text-sm text-ink/60 mt-6 text-center">
          New here?{' '}
          <Link href="/signup" className="text-teal font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
