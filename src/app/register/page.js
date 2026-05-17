'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <Link href="/" className="inline-flex items-center gap-3 mb-12">
          <div className="w-8 h-8 border border-ink rotate-45 flex items-center justify-center">
            <div className="w-3 h-3 bg-terracotta rotate-45" />
          </div>
          <span className="display-font text-2xl">Mirath</span>
        </Link>

        <h1 className="display-font text-5xl mb-2">Create account.</h1>
        <p className="opacity-70 mb-10">Begin building your family inheritance database.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Full Name</label>
            <input type="text" required className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password (min 6 chars)</label>
            <input type="password" required minLength={6} className="input" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && (
            <div className="text-sm text-terracotta border border-terracotta/30 bg-terracotta/5 px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Creating…' : 'Create Account →'}
          </button>
        </form>

        <p className="mt-8 text-sm opacity-70">
          Already have an account?{' '}
          <Link href="/login" className="text-terracotta underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
