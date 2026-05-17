'use client';
import { useEffect, useState } from 'react';
import { PROPERTY_TYPES } from '@/lib/propertyTypes';

export default function StatsDashboard({ familyId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/families/${familyId}/stats`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }, [familyId]);

  if (loading) return <div className="text-center py-12 opacity-60">Loading statistics…</div>;
  if (!stats) return null;

  const fmt = (n) => Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={stats.summary.totalPersons} sub={`${stats.summary.livingCount} living · ${stats.summary.deceasedCount} deceased`} />
        <StatCard label="Properties" value={stats.summary.totalProperties} sub="across all members" />
        <StatCard label="Total Wealth" value={`₨ ${fmt(stats.summary.totalWealth)}`} sub={`Net: ₨ ${fmt(stats.summary.netWealth)}`} color="terracotta" />
        <StatCard label="Avg per Person" value={`₨ ${fmt(stats.summary.avgWealthPerPerson)}`} sub="across all members" />
      </div>

      {/* Demographics */}
      <div className="card p-6">
        <h3 className="display-font text-2xl mb-4">Demographics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs opacity-60 uppercase tracking-wider">♂ Male</div>
            <div className="mono-font text-3xl">{stats.summary.maleCount}</div>
          </div>
          <div>
            <div className="text-xs opacity-60 uppercase tracking-wider">♀ Female</div>
            <div className="mono-font text-3xl">{stats.summary.femaleCount}</div>
          </div>
          <div>
            <div className="text-xs opacity-60 uppercase tracking-wider">Living</div>
            <div className="mono-font text-3xl text-sage">{stats.summary.livingCount}</div>
          </div>
          <div>
            <div className="text-xs opacity-60 uppercase tracking-wider">Deceased</div>
            <div className="mono-font text-3xl text-terracotta">{stats.summary.deceasedCount}</div>
          </div>
        </div>
      </div>

      {/* Generation breakdown */}
      {stats.generationArray.length > 0 && (
        <div className="card p-6">
          <h3 className="display-font text-2xl mb-4">Generations</h3>
          <div className="space-y-3">
            {stats.generationArray.map(g => (
              <div key={g.level} className="flex items-center gap-4">
                <div className="w-16 text-xs uppercase tracking-wider opacity-60 font-semibold">Gen {g.level + 1}</div>
                <div className="flex-1 flex h-8 overflow-hidden rounded-sm border border-black/10">
                  <div className="bg-sage flex items-center justify-end px-2 text-xs text-white"
                       style={{ width: `${(g.living / g.count) * 100}%` }}>
                    {g.living > 0 && g.living}
                  </div>
                  <div className="bg-terracotta flex items-center justify-end px-2 text-xs text-white"
                       style={{ width: `${(g.deceased / g.count) * 100}%` }}>
                    {g.deceased > 0 && g.deceased}
                  </div>
                </div>
                <div className="w-20 text-right mono-font text-sm">{g.count} total</div>
              </div>
            ))}
          </div>
          <div className="text-xs opacity-50 mt-3 flex gap-4">
            <span><span className="inline-block w-3 h-3 bg-sage rounded-sm mr-1.5 align-middle"></span>Living</span>
            <span><span className="inline-block w-3 h-3 bg-terracotta rounded-sm mr-1.5 align-middle"></span>Deceased</span>
          </div>
        </div>
      )}

      {/* Properties by type */}
      {Object.keys(stats.propsByType).length > 0 && (
        <div className="card p-6">
          <h3 className="display-font text-2xl mb-4">Wealth by Asset Type</h3>
          <div className="space-y-3">
            {Object.entries(stats.propsByType).sort((a, b) => b[1].value - a[1].value).map(([type, data]) => {
              const config = PROPERTY_TYPES[type] || PROPERTY_TYPES.other;
              const pctOfWealth = (data.value / stats.summary.totalWealth) * 100;
              return (
                <div key={type} className="flex items-center gap-4">
                  <div className="text-2xl w-8">{config.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-sm mono-font">{data.count} {data.count === 1 ? 'item' : 'items'} · ₨ {fmt(data.value)}</div>
                    </div>
                    <div className="h-2 bg-black/5 rounded-sm overflow-hidden">
                      <div className="h-full" style={{ width: `${pctOfWealth}%`, background: config.color }} />
                    </div>
                  </div>
                  <div className="w-16 text-right mono-font text-sm opacity-60">{pctOfWealth.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wealthiest members */}
      {stats.wealthByPerson.filter(p => p.wealth > 0).length > 0 && (
        <div className="card p-6">
          <h3 className="display-font text-2xl mb-4">Wealth Holders</h3>
          <div className="space-y-2">
            {stats.wealthByPerson.filter(p => p.wealth > 0).slice(0, 10).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-black/5 last:border-0">
                <div className="w-6 text-xs opacity-50 mono-font">{i + 1}</div>
                <div className="flex-1">
                  <div className="font-medium">{p.name}{!p.isAlive && ' ✝'}</div>
                  <div className="text-xs opacity-60">{p.propertyCount} {p.propertyCount === 1 ? 'property' : 'properties'}</div>
                </div>
                <div className="mono-font font-semibold">₨ {fmt(p.wealth)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card p-5">
      <div className="text-xs opacity-60 uppercase tracking-wider mb-2">{label}</div>
      <div className={`mono-font text-2xl ${color === 'terracotta' ? 'text-terracotta' : ''}`}>{value}</div>
      {sub && <div className="text-xs opacity-50 mt-1">{sub}</div>}
    </div>
  );
}
