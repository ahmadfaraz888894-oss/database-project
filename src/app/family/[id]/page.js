'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import FamilyTreeView from '@/components/FamilyTreeView';
import PersonForm from '@/components/PersonForm';
import PropertyForm from '@/components/PropertyForm';
import InheritanceResults from '@/components/InheritanceResults';
import StatsDashboard from '@/components/StatsDashboard';
import ShareLookup from '@/components/ShareLookup';
import VaultView from '@/components/VaultView';
import { getPropertyIcon, formatPropertyDetails, PROPERTY_TYPES } from '@/lib/propertyTypes';

export default function FamilyPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tree');
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showPropForm, setShowPropForm] = useState(false);

  // Calc tab state
  const [calcDeceased, setCalcDeceased] = useState('');
  const [calcMode, setCalcMode] = useState('representation');
  const [simulateMode, setSimulateMode] = useState(false);
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Search/filter state for People tab
  const [personSearch, setPersonSearch] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Search/filter for Properties tab
  const [propSearch, setPropSearch] = useState('');
  const [filterPropType, setFilterPropType] = useState('all');

  useEffect(() => {
    loadFamily();
  }, [params.id]);

  async function loadFamily() {
    setLoading(true);
    try {
      const res = await fetch(`/api/families/${params.id}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 404) { router.push('/dashboard'); return; }
      const data = await res.json();
      setFamily(data.family);
    } finally {
      setLoading(false);
    }
  }

  async function deletePerson(id) {
    if (!confirm('Delete this person? Their properties will also be removed.')) return;
    await fetch(`/api/persons/${id}`, { method: 'DELETE' });
    loadFamily();
  }

  async function deleteProperty(id) {
    if (!confirm('Delete this property?')) return;
    await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    loadFamily();
  }

  async function runCalculation() {
    if (!calcDeceased) return;
    setCalculating(true);
    setCalcResult(null);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deceasedId: calcDeceased,
          mode: calcMode,
          simulateDeath: simulateMode,
        }),
      });
      const data = await res.json();
      setCalcResult(data);
    } finally {
      setCalculating(false);
    }
  }

  async function exportFamily() {
    window.location.href = `/api/families/${params.id}/export`;
  }

  async function importFamily(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/families/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        alert(`Imported successfully!\n${result.imported.persons} persons, ${result.imported.properties} properties, ${result.imported.spouses} marriages`);
        router.push(`/family/${result.family.id}`);
      } else {
        alert('Import failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to read file: ' + err.message);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const fmt = (n) => Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 });

  // Filtered persons & properties
  const filteredPersons = useMemo(() => {
    if (!family) return [];
    return family.persons.filter(p => {
      if (personSearch && !p.fullName.toLowerCase().includes(personSearch.toLowerCase())) return false;
      if (filterGender !== 'all' && p.gender !== filterGender) return false;
      if (filterStatus === 'living' && !p.isAlive) return false;
      if (filterStatus === 'deceased' && p.isAlive) return false;
      return true;
    });
  }, [family, personSearch, filterGender, filterStatus]);

  const filteredProperties = useMemo(() => {
    if (!family) return [];
    return family.properties.filter(p => {
      if (propSearch) {
        const hay = `${p.name} ${p.location || ''} ${p.owner?.fullName || ''}`.toLowerCase();
        if (!hay.includes(propSearch.toLowerCase())) return false;
      }
      if (filterPropType !== 'all' && p.type !== filterPropType) return false;
      return true;
    });
  }, [family, propSearch, filterPropType]);

  if (loading) return <div className="min-h-screen flex items-center justify-center opacity-60">Loading…</div>;
  if (!family) return null;

  const deceasedPersons = family.persons.filter(p => !p.isAlive);
  const livingPersons = family.persons.filter(p => p.isAlive);
  const calcDeceasedPerson = family.persons.find(p => p.id === calcDeceased);
  const totalWealth = family.properties.reduce((s, p) => s + p.value, 0);

  return (
    <main className="min-h-screen">
      <nav className="border-b border-black/10 bg-cream/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-ink rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-terracotta rotate-45" />
            </div>
            <span className="display-font text-2xl">Mirath</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm hover:text-terracotta">← Dashboard</Link>
            <button onClick={logout} className="text-sm hover:text-terracotta">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-terracotta mb-3">Family Tree</div>
            <h1 className="display-font text-5xl mb-2">{family.name}</h1>
            {family.description && <p className="opacity-70">{family.description}</p>}
            <div className="flex gap-4 mt-4 text-sm opacity-60 flex-wrap">
              <span>{family.persons.length} members</span>
              <span>•</span>
              <span>{family.properties.length} properties</span>
              <span>•</span>
              <span>Total: ₨ {fmt(totalWealth)}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportFamily} className="btn-secondary text-sm">⬇ Backup JSON</button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={e => e.target.files[0] && importFamily(e.target.files[0])}
            />
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-sm">⬆ Import</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-black/10 mb-8 overflow-x-auto">
          {[
            { id: 'tree', label: '🌳 Tree' },
            { id: 'people', label: `👥 People (${family.persons.length})` },
            { id: 'properties', label: `🏠 Properties (${family.properties.length})` },
            { id: 'calculate', label: '⚖ Calculate' },
            { id: 'lookup', label: '🔍 Who Gets What?' },
            { id: 'stats', label: '📊 Statistics' },
            { id: 'vault', label: '🔒 Vault' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id ? 'border-terracotta text-ink font-medium' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TREE TAB */}
        {tab === 'tree' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setEditingPerson(null); setShowPersonForm(true); }} className="btn-primary text-sm">+ Add Person</button>
            </div>
            <FamilyTreeView persons={family.persons} spouses={family.persons.flatMap(p => p.spouses || [])} />
          </div>
        )}

        {/* PEOPLE TAB */}
        {tab === 'people' && (
          <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h2 className="display-font text-3xl">Family Members</h2>
              <button onClick={() => { setEditingPerson(null); setShowPersonForm(true); }} className="btn-primary text-sm">+ Add Person</button>
            </div>

            {/* Search & filter */}
            <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
              <input type="text" className="input flex-1 min-w-[200px]" placeholder="🔍 Search by name..." value={personSearch} onChange={e => setPersonSearch(e.target.value)} />
              <select className="input w-auto" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                <option value="all">All Genders</option>
                <option value="male">Males only</option>
                <option value="female">Females only</option>
              </select>
              <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="living">Living only</option>
                <option value="deceased">Deceased only</option>
              </select>
              <div className="text-xs opacity-60">{filteredPersons.length} of {family.persons.length}</div>
            </div>

            {filteredPersons.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="display-font italic text-2xl opacity-60 mb-3">No matches.</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredPersons.map(p => {
                  const father = family.persons.find(x => x.id === p.fatherId);
                  const mother = family.persons.find(x => x.id === p.motherId);
                  const wealth = family.properties.filter(pr => pr.ownerId === p.id).reduce((s, pr) => s + pr.value, 0);
                  return (
                    <div key={p.id} className="card p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="display-font text-xl">{p.fullName}</div>
                          <div className="text-xs opacity-60 uppercase tracking-wider">
                            {p.gender} · {p.isAlive ? 'Living' : '✝ Deceased'}{!p.isMuslim && ' · Non-Muslim'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingPerson(p); setShowPersonForm(true); }} className="text-xs opacity-50 hover:opacity-100 hover:text-terracotta">Edit</button>
                          <button onClick={() => deletePerson(p.id)} className="text-xs opacity-50 hover:text-terracotta hover:opacity-100">Delete</button>
                        </div>
                      </div>
                      <div className="text-xs space-y-1 opacity-70">
                        {father && <div>Father: {father.fullName}</div>}
                        {mother && <div>Mother: {mother.fullName}</div>}
                        {wealth > 0 && <div className="text-sage font-medium">Owns ₨ {fmt(wealth)} in assets</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROPERTIES TAB */}
        {tab === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h2 className="display-font text-3xl">Properties & Assets</h2>
              <button onClick={() => setShowPropForm(true)} disabled={family.persons.length === 0} className="btn-primary text-sm disabled:opacity-50">+ Add Property</button>
            </div>

            {/* Search & filter */}
            <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
              <input type="text" className="input flex-1 min-w-[200px]" placeholder="🔍 Search by name, location, owner..." value={propSearch} onChange={e => setPropSearch(e.target.value)} />
              <select className="input w-auto" value={filterPropType} onChange={e => setFilterPropType(e.target.value)}>
                <option value="all">All Types</option>
                {Object.entries(PROPERTY_TYPES).map(([k, t]) => <option key={k} value={k}>{t.icon} {t.label}</option>)}
              </select>
              <div className="text-xs opacity-60">{filteredProperties.length} of {family.properties.length}</div>
            </div>

            {family.persons.length === 0 ? (
              <div className="card p-12 text-center"><p className="opacity-70">Add at least one person first.</p></div>
            ) : filteredProperties.length === 0 ? (
              <div className="card p-12 text-center"><div className="display-font italic text-2xl opacity-60">No matches.</div></div>
            ) : (
              <div className="space-y-3">
                {filteredProperties.map(p => {
                  const details = formatPropertyDetails(p);
                  return (
                    <div key={p.id} className="card p-5 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-3xl">{getPropertyIcon(p.type)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="display-font text-xl truncate">{p.name}</div>
                          <div className="text-xs opacity-60 truncate">
                            {PROPERTY_TYPES[p.type]?.label || p.type} · Owner: {p.owner.fullName}
                          </div>
                          {details && <div className="text-xs opacity-50 mt-1 truncate">{details}</div>}
                          {p.location && <div className="text-xs opacity-60 mt-0.5">📍 {p.location}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="mono-font text-2xl">{p.currency} {fmt(p.value)}</div>
                          {(p.debts > 0 || p.funeralCost > 0 || p.bequest > 0) && (
                            <div className="text-xs opacity-60">
                              {p.debts > 0 && `Debt: ${fmt(p.debts)} `}
                              {p.funeralCost > 0 && `Funeral: ${fmt(p.funeralCost)} `}
                              {p.bequest > 0 && `Bequest: ${fmt(p.bequest)}`}
                            </div>
                          )}
                        </div>
                        <button onClick={() => deleteProperty(p.id)} className="text-xs opacity-50 hover:text-terracotta hover:opacity-100">×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CALCULATE TAB */}
        {tab === 'calculate' && (
          <div className="space-y-6">
            <div className="card p-8">
              <div className="text-xs tracking-[0.3em] uppercase text-terracotta mb-3">Faraid Calculator</div>
              <h2 className="display-font text-3xl mb-3">Calculate Inheritance</h2>
              <p className="opacity-70 mb-6 text-sm">
                Choose a deceased person to see how their estate distributes. Use simulation mode to see "what if" scenarios for living people (excellent for Wasiyyah planning).
              </p>

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setSimulateMode(false)}
                  className={`p-4 border text-left transition-all ${!simulateMode ? 'border-ink bg-ink text-cream' : 'border-black/15'}`}
                >
                  <div className="font-semibold mb-1">⚖ Real Inheritance</div>
                  <div className="text-xs opacity-80">For someone who has actually died</div>
                </button>
                <button
                  onClick={() => setSimulateMode(true)}
                  className={`p-4 border text-left transition-all ${simulateMode ? 'border-terracotta bg-terracotta text-cream' : 'border-black/15'}`}
                >
                  <div className="font-semibold mb-1">🔮 Wasiyyah Simulation</div>
                  <div className="text-xs opacity-80">"What if X died today?" — for planning</div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="label">{simulateMode ? 'Simulate Death of...' : 'Deceased Person'}</label>
                  <select className="input" value={calcDeceased} onChange={e => setCalcDeceased(e.target.value)}>
                    <option value="">— Select person —</option>
                    {(simulateMode ? livingPersons : deceasedPersons).map(p => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Inheritance Mode</label>
                  <select className="input" value={calcMode} onChange={e => setCalcMode(e.target.value)}>
                    <option value="representation">Representation (Modern Pakistani Law)</option>
                    <option value="classical">Classical (Strict Hanafi)</option>
                  </select>
                  <div className="text-xs opacity-60 mt-1">
                    {calcMode === 'representation' ? 'Predeceased heirs\' shares cascade to their children.' : 'Predeceased heirs are excluded; their share goes to surviving siblings.'}
                  </div>
                </div>
              </div>

              <button onClick={runCalculation} disabled={!calcDeceased || calculating} className="btn-primary">
                {calculating ? 'Calculating…' : 'Calculate Distribution →'}
              </button>

              {!simulateMode && deceasedPersons.length === 0 && (
                <div className="mt-4 text-sm opacity-70 italic">No deceased persons. Mark someone as deceased in the People tab, or use Simulation mode.</div>
              )}
            </div>

            {calcResult && <InheritanceResults result={calcResult} deceasedName={calcDeceasedPerson?.fullName || ''} />}
          </div>
        )}

        {/* LOOKUP TAB */}
        {tab === 'lookup' && (
          <ShareLookup familyId={family.id} persons={family.persons} />
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          <StatsDashboard familyId={family.id} />
        )}

        {/* VAULT TAB */}
        {tab === 'vault' && (
          <VaultView familyId={family.id} persons={family.persons} />
        )}
      </div>

      {/* Modals */}
      {showPersonForm && (
        <PersonForm
          familyId={family.id}
          persons={family.persons}
          editPerson={editingPerson}
          onClose={() => { setShowPersonForm(false); setEditingPerson(null); }}
          onSaved={loadFamily}
        />
      )}
      {showPropForm && (
        <PropertyForm
          familyId={family.id}
          persons={family.persons}
          onClose={() => setShowPropForm(false)}
          onSaved={loadFamily}
        />
      )}
    </main>
  );
}
