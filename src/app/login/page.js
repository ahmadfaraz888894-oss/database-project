'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-up">
        <Link href="/" className="inline-flex items-center gap-3 mb-12">
          <div className="w-8 h-8 border border-ink rotate-45 flex items-center justify-center">
            <div className="w-3 h-3 bg-terracotta rotate-45" />
          </div>
          <span className="display-font text-2xl">Mirath</span>
        </Link>

        <h1 className="display-font text-5xl mb-2">Welcome back.</h1>
        <p className="opacity-70 mb-10">Sign in to your family inheritance database.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-terracotta border border-terracotta/30 bg-terracotta/5 px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="mt-8 text-sm opacity-70">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-terracotta underline">Create one</Link>
        </p>
      </div>
    </main>
  );
}
