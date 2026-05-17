'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadFamilies();
  }, []);

  async function loadFamilies() {
    setLoading(true);
    try {
      const res = await fetch('/api/families');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setFamilies(data.families || []);
    } finally {
      setLoading(false);
    }
  }

  async function createFamily(e) {
    e.preventDefault();
    const res = await fetch('/api/families', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    if (res.ok) {
      setNewName('');
      setNewDesc('');
      setShowNew(false);
      loadFamilies();
    }
  }

  async function deleteFamily(id) {
    if (!confirm('Delete this family tree and all its data? This cannot be undone.')) return;
    await fetch(`/api/families/${id}`, { method: 'DELETE' });
    loadFamilies();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-black/10 bg-cream/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-ink rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-terracotta rotate-45" />
            </div>
            <span className="display-font text-2xl">Mirath</span>
          </Link>
          <button onClick={logout} className="text-sm hover:text-terracotta transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-terracotta mb-3">Your Database</div>
            <h1 className="display-font text-5xl">Family Trees</h1>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            + New Family Tree
          </button>
        </div>

        {showNew && (
          <div className="card p-8 mb-8 animate-fade-up">
            <h3 className="display-font text-2xl mb-6">Create Family Tree</h3>
            <form onSubmit={createFamily} className="space-y-5">
              <div>
                <label className="label">Family Name</label>
                <input
                  required
                  type="text"
                  className="input"
                  placeholder="e.g., Khan Family"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="A brief description of this family..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">Create</button>
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 opacity-60">Loading…</div>
        ) : families.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="display-font text-3xl mb-3 italic opacity-60">No family trees yet.</div>
            <p className="opacity-70 mb-6">Create your first family tree to begin tracking inheritance.</p>
            <button onClick={() => setShowNew(true)} className="btn-primary">
              + Create First Tree
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((f, i) => (
              <div key={f.id} className="card p-6 animate-fade-up" style={{animationDelay: `${i * 0.05}s`}}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="display-font text-2xl">{f.name}</h3>
                  <button onClick={() => deleteFamily(f.id)} className="text-xs opacity-50 hover:text-terracotta hover:opacity-100">×</button>
                </div>
                {f.description && <p className="text-sm opacity-70 mb-4">{f.description}</p>}
                <div className="flex gap-4 text-xs opacity-60 mb-6">
                  <span>{f._count.persons} members</span>
                  <span>•</span>
                  <span>{f._count.properties} properties</span>
                </div>
                <Link href={`/family/${f.id}`} className="btn-secondary text-sm w-full justify-center">
                  Open →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
