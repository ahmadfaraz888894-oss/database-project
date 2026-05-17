'use client';
import { useState, useMemo } from 'react';

export default function ShareLookup({ familyId, persons }) {
  const [deceasedId, setDeceasedId] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [deceasedSearch, setDeceasedSearch] = useState('');
  const [lookupSearch, setLookupSearch] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allLiving, setAllLiving] = useState(false);
  const [allResults, setAllResults] = useState(null);

  const filteredDeceased = useMemo(() => {
    return persons.filter(p =>
      p.fullName.toLowerCase().includes(deceasedSearch.toLowerCase())
    );
  }, [persons, deceasedSearch]);

  const filteredLookup = useMemo(() => {
    return persons.filter(p =>
      p.isAlive && p.fullName.toLowerCase().includes(lookupSearch.toLowerCase())
    );
  }, [persons, lookupSearch]);

  const deceased = persons.find(p => p.id === deceasedId);

  async function runLookup(specificLookupId) {
    const targetLookupId = specificLookupId || lookupId;
    if (!deceasedId || !targetLookupId) return;
    setLoading(true);
    setAllResults(null);
    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deceasedId,
          lookupPersonId: targetLookupId,
          simulateDeath: deceased?.isAlive,
        }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function showAllHeirs() {
    if (!deceasedId) return;
    setLoading(true);
    setResult(null);
    try {
      // Run calculation once to get all heirs
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deceasedId,
          simulateDeath: deceased?.isAlive,
        }),
      });
      const data = await res.json();
      setAllResults(data);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n) => Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <div className="text-xs tracking-[0.3em] uppercase text-terracotta mb-3">Who Gets What?</div>
        <h2 className="display-font text-3xl mb-2">Personal Share Lookup</h2>
        <p className="opacity-70 mb-6 text-sm">
          Find out exactly what any family member would inherit. Pick the deceased (or simulate someone's death), then search for the person whose share you want to see.
        </p>

        {/* Step 1: Select deceased */}
        <div className="mb-5">
          <label className="label">Step 1: Whose Estate?</label>
          <input
            type="text"
            className="input mb-2"
            placeholder="🔍 Search family members..."
            value={deceasedSearch}
            onChange={e => setDeceasedSearch(e.target.value)}
          />
          {deceasedSearch && (
            <div className="max-h-48 overflow-y-auto border border-black/10">
              {filteredDeceased.length === 0 ? (
                <div className="p-3 text-sm opacity-60 italic">No matches</div>
              ) : (
                filteredDeceased.slice(0, 10).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setDeceasedId(p.id);
                      setDeceasedSearch(p.fullName);
                    }}
                    className={`w-full text-left p-2.5 text-sm hover:bg-cream transition-colors border-b border-black/5 last:border-0 ${
                      deceasedId === p.id ? 'bg-cream font-semibold' : ''
                    }`}
                  >
                    {p.fullName}
                    <span className="opacity-60 ml-2 text-xs">
                      {p.gender === 'male' ? '♂' : '♀'} {p.isAlive ? '(simulate death)' : '✝ deceased'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
          {deceasedId && deceased && (
            <div className="mt-3 p-3 bg-cream border-l-2 border-terracotta text-sm">
              <span className="font-semibold">Selected:</span> {deceased.fullName}
              {deceased.isAlive && <span className="text-terracotta italic ml-2">(will simulate death)</span>}
            </div>
          )}
        </div>

        {/* Step 2: Choose action */}
        {deceasedId && (
          <div>
            <label className="label">Step 2: What do you want to see?</label>
            <div className="grid md:grid-cols-2 gap-3 mt-2">
              <button
                onClick={showAllHeirs}
                className="card p-4 text-left hover:border-ink transition-colors"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="font-semibold mb-1">All heirs at once</div>
                <div className="text-xs opacity-70">See the full distribution among everyone</div>
              </button>
              <button
                onClick={() => { setAllResults(null); setLookupSearch(''); }}
                className="card p-4 text-left hover:border-ink transition-colors"
              >
                <div className="text-2xl mb-2">🔎</div>
                <div className="font-semibold mb-1">Specific person</div>
                <div className="text-xs opacity-70">Search for one person's share only</div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Search specific person */}
        {deceasedId && !allResults && (
          <div className="mt-5">
            <label className="label">Search by name</label>
            <input
              type="text"
              className="input mb-2"
              placeholder="🔍 Type name..."
              value={lookupSearch}
              onChange={e => setLookupSearch(e.target.value)}
            />
            {lookupSearch && (
              <div className="max-h-48 overflow-y-auto border border-black/10">
                {filteredLookup.length === 0 ? (
                  <div className="p-3 text-sm opacity-60 italic">No matches</div>
                ) : (
                  filteredLookup.slice(0, 10).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setLookupId(p.id);
                        setLookupSearch(p.fullName);
                        runLookup(p.id);
                      }}
                      className="w-full text-left p-2.5 text-sm hover:bg-cream transition-colors border-b border-black/5 last:border-0"
                    >
                      {p.fullName}
                      <span className="opacity-60 ml-2 text-xs">
                        {p.gender === 'male' ? '♂' : '♀'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result: single person */}
      {result && (
        <div className="card p-8 animate-fade-up">
          {result.inheritsFrom ? (
            <>
              <div className="text-xs tracking-[0.3em] uppercase text-sage mb-2">✓ Inheritance Found</div>
              <div className="display-font text-3xl mb-3">
                {result.lookupPerson.name} would inherit:
              </div>
              <div className="mono-font text-5xl text-terracotta mb-3">
                ₨ {fmt(result.totalAmount)}
              </div>
              <div className="opacity-70 mb-6">
                That's {result.totalPercentage}% of {result.deceasedName}'s estate
                {result.deceasedIsSimulated && ' (simulated death)'}
              </div>

              <div className="border-t border-black/10 pt-4 space-y-3">
                {result.myShares.map((s, i) => (
                  <div key={i} className="text-sm">
                    <div className="font-medium">
                      As <span className="text-terracotta">{s.relationship}</span>
                      {s.cascadedFrom && <span className="opacity-60"> · via {s.cascadedFrom}</span>}
                    </div>
                    <div className="mono-font text-lg">₨ {fmt(s.amount)} ({parseFloat(s.percentage).toFixed(3)}%)</div>
                    <div className="text-xs opacity-60 italic">{s.reason}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs tracking-[0.3em] uppercase text-terracotta mb-2">✗ Not an Heir</div>
              <div className="display-font text-3xl mb-3">
                {result.lookupPerson.name} would not inherit
              </div>
              <div className="opacity-70">
                Based on Hanafi Faraid rules, this person is not among the eligible heirs of {result.deceasedName}.
                <br/>
                <span className="text-xs italic">Common reasons: not a close enough relative, blocked by closer heirs (e.g., grandchild blocked by living parent), or no relationship in family tree.</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Result: all heirs */}
      {allResults && allResults.shares && (
        <div className="card p-8 animate-fade-up">
          <h3 className="display-font text-2xl mb-1">All Heirs of {allResults.deceasedPersonName}</h3>
          <div className="text-sm opacity-70 mb-6">
            Net estate: ₨ {fmt(allResults.netEstate)}{allResults.isSimulation && ' (simulation)'}
          </div>
          {allResults.shares.length === 0 ? (
            <div className="opacity-60 italic">No eligible heirs.</div>
          ) : (
            <div className="space-y-2">
              {allResults.shares.map((s, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 py-2.5 border-b border-black/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs opacity-60">
                      {s.relationship}
                      {s.cascadedFrom && <span> · via {s.cascadedFrom}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mono-font font-semibold">₨ {fmt(s.amount)}</div>
                    <div className="text-xs opacity-60">{parseFloat(s.percentage).toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 opacity-60">Calculating…</div>
      )}
    </div>
  );
}
