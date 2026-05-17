'use client';
import { useState, useEffect } from 'react';

const CATEGORIES = {
  identity: { label: 'Identity Documents', icon: '🪪', examples: 'CNIC, Passport, B-form' },
  property_deed: { label: 'Property Deeds', icon: '📜', examples: 'Registry, Allotment letter, Mutation' },
  wasiyyah: { label: 'Wasiyyah / Will', icon: '✍️', examples: 'Written will, Bequest documents' },
  marriage: { label: 'Marriage', icon: '💍', examples: 'Nikah Nama, Marriage Certificate' },
  bank: { label: 'Banking', icon: '🏦', examples: 'Account statements, FD certificates' },
  insurance: { label: 'Insurance / Takaful', icon: '🛡️', examples: 'Policy documents' },
  medical: { label: 'Medical', icon: '🏥', examples: 'Death certificate, Medical records' },
  other: { label: 'Other', icon: '📄', examples: 'Any other important document' },
};

export default function VaultView({ familyId, persons }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadDocs(); }, [familyId]);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?familyId=${familyId}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDoc(id) {
    if (!confirm('Remove this document record?')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    loadDocs();
  }

  const filteredDocs = filter === 'all' ? documents : documents.filter(d => d.category === filter);

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-terracotta mb-2">🔒 Family Vault</div>
            <h2 className="display-font text-3xl">Important Documents</h2>
            <p className="opacity-70 mt-2 text-sm max-w-2xl">
              Track where important family documents are kept. This stores notes about your documents (location, expiry, owner) — not the actual files. Helps your family find everything when needed.
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Add Document</button>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mt-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm border ${filter === 'all' ? 'bg-ink text-cream border-ink' : 'border-black/15'}`}
          >
            All ({documents.length})
          </button>
          {Object.entries(CATEGORIES).map(([k, c]) => {
            const count = documents.filter(d => d.category === k).length;
            if (count === 0) return null;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 text-sm border ${filter === k ? 'bg-ink text-cream border-ink' : 'border-black/15'}`}
              >
                {c.icon} {c.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 opacity-60">Loading…</div>
      ) : filteredDocs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="display-font italic text-2xl opacity-60 mb-3">No documents yet.</div>
          <p className="opacity-70 text-sm mb-4">Start tracking your family's important documents.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Add First Document</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredDocs.map(d => {
            const cat = CATEGORIES[d.category] || CATEGORIES.other;
            const expiringSoon = d.dateExpires && new Date(d.dateExpires) < new Date(Date.now() + 90 * 86400000);
            const expired = d.dateExpires && new Date(d.dateExpires) < new Date();
            return (
              <div key={d.id} className={`card p-5 ${d.isImportant ? 'border-terracotta border-2' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-3xl">{cat.icon}</div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{d.title}</div>
                      <div className="text-xs opacity-60">{cat.label}</div>
                      {d.person && <div className="text-xs opacity-60 mt-0.5">For: {d.person.fullName}</div>}
                    </div>
                  </div>
                  <button onClick={() => deleteDoc(d.id)} className="text-xs opacity-50 hover:text-terracotta">×</button>
                </div>
                {d.fileLocation && (
                  <div className="text-sm mt-3 bg-cream p-2 border-l-2 border-sage">
                    📍 <span className="opacity-80">{d.fileLocation}</span>
                  </div>
                )}
                {d.description && <div className="text-sm opacity-70 mt-2">{d.description}</div>}
                {d.dateExpires && (
                  <div className={`text-xs mt-2 ${expired ? 'text-terracotta font-semibold' : expiringSoon ? 'text-gold' : 'opacity-60'}`}>
                    {expired ? '⚠ EXPIRED' : expiringSoon ? '⏳ Expiring soon' : '📅'} {new Date(d.dateExpires).toLocaleDateString('en-PK')}
                  </div>
                )}
                {d.isImportant && (
                  <div className="text-xs text-terracotta font-semibold mt-2">★ MARKED IMPORTANT</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <DocumentForm
          familyId={familyId}
          persons={persons}
          onClose={() => setShowForm(false)}
          onSaved={loadDocs}
        />
      )}
    </div>
  );
}

function DocumentForm({ familyId, persons, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('identity');
  const [personId, setPersonId] = useState('');
  const [description, setDescription] = useState('');
  const [fileLocation, setFileLocation] = useState('');
  const [dateCreated, setDateCreated] = useState('');
  const [dateExpires, setDateExpires] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId, title, category,
          personId: personId || null,
          description, fileLocation,
          dateCreated: dateCreated || null,
          dateExpires: dateExpires || null,
          isImportant,
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-cream w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h3 className="display-font text-3xl mb-6">Add Document</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Title</label>
              <input required type="text" className="input" placeholder="e.g., CNIC of Abdullah Khan"
                     value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="label">Category</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(CATEGORIES).map(([k, c]) => (
                  <button key={k} type="button" onClick={() => setCategory(k)}
                          className={`p-3 border text-left transition-all ${
                            category === k ? 'border-ink bg-ink text-cream' : 'border-black/15'
                          }`}>
                    <div className="text-xl mb-1">{c.icon}</div>
                    <div className="text-xs font-medium leading-tight">{c.label}</div>
                  </button>
                ))}
              </div>
              <div className="text-xs opacity-60 mt-2">Examples: {CATEGORIES[category].examples}</div>
            </div>

            <div>
              <label className="label">Belongs to (optional)</label>
              <select className="input" value={personId} onChange={e => setPersonId(e.target.value)}>
                <option value="">— No specific person —</option>
                {persons.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Physical Location / Notes</label>
              <input type="text" className="input"
                     placeholder="e.g., Bank locker #234, HBL DHA Branch / Top drawer in study"
                     value={fileLocation} onChange={e => setFileLocation(e.target.value)} />
              <div className="text-xs opacity-60 mt-1">Where is the original kept? So family can find it.</div>
            </div>

            <div>
              <label className="label">Description (optional)</label>
              <textarea className="input" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date Created</label>
                <input type="date" className="input" value={dateCreated} onChange={e => setDateCreated(e.target.value)} />
              </div>
              <div>
                <label className="label">Date Expires (optional)</label>
                <input type="date" className="input" value={dateExpires} onChange={e => setDateExpires(e.target.value)} />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} />
              <span className="text-sm">★ Mark as critically important</span>
            </label>

            <div className="flex gap-3 pt-4 border-t border-black/10">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Add Document'}</button>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
