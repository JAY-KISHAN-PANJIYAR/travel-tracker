import Link from 'next/link';
import AuthForm from '@/components/AuthForm';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-parchment rounded-xl shadow-card p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark font-mono mb-2">My Atlas</p>
        <h1 className="font-display text-3xl text-ink mb-1">Start your map</h1>
        <p className="text-sm text-ink/60 mb-6">Create an account to log your first trip.</p>

        <AuthForm mode="signup" />

        <p className="text-sm text-ink/60 mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-teal font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
