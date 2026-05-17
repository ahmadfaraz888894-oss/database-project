'use client';
import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

const COUPLE_COLORS = [
  '#b85c3a', '#6b7a5a', '#a8884b', '#2d3a2e',
  '#7c5295', '#4a6fa5', '#a73e3e', '#5c8ba1',
  '#8a6e3e', '#9c5c8c', '#4a8474', '#a86848',
];

function buildLayout(persons, spouseRelations) {
  if (!persons || persons.length === 0) return { nodes: [], edges: [], legend: [] };

  const personIds = new Set(persons.map(p => p.id));

  // Build couple groups
  const coupleMap = new Map();
  let colorIdx = 0;
  for (const p of persons) {
    if (p.fatherId || p.motherId) {
      const key = `${p.fatherId || 'unknown'}|${p.motherId || 'unknown'}`;
      if (!coupleMap.has(key)) {
        coupleMap.set(key, {
          color: COUPLE_COLORS[colorIdx % COUPLE_COLORS.length],
          fatherId: p.fatherId,
          motherId: p.motherId,
          children: [],
        });
        colorIdx++;
      }
      coupleMap.get(key).children.push(p);
    }
  }

  // Build spouse pairs (for horizontal lines)
  // Use spouseRelations (from API) OR infer from parent pairings
  const spousePairs = new Map(); // "a|b" with a<b
  if (spouseRelations && spouseRelations.length > 0) {
    for (const s of spouseRelations) {
      if (s.isActive === false) continue;
      const a = s.personId, b = s.spouseId;
      if (a && b) {
        const k = [a, b].sort().join('|');
        spousePairs.set(k, { personId: a, spouseId: b });
      }
    }
  }
  // Also infer spouse pairs from couples that have children together
  for (const [, couple] of coupleMap.entries()) {
    if (couple.fatherId && couple.motherId) {
      const k = [couple.fatherId, couple.motherId].sort().join('|');
      if (!spousePairs.has(k)) {
        spousePairs.set(k, { personId: couple.fatherId, spouseId: couple.motherId });
      }
    }
  }

  // Roots = persons with no parents in tree
  const roots = persons.filter(
    p => (!p.fatherId || !personIds.has(p.fatherId)) && (!p.motherId || !personIds.has(p.motherId))
  );

  // Generation levels via BFS
  const levels = new Map();
  for (const r of roots) levels.set(r.id, 0);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of persons) {
      const parentLvls = [];
      if (p.fatherId && levels.has(p.fatherId)) parentLvls.push(levels.get(p.fatherId));
      if (p.motherId && levels.has(p.motherId)) parentLvls.push(levels.get(p.motherId));
      if (parentLvls.length > 0) {
        const nl = Math.max(...parentLvls) + 1;
        if (!levels.has(p.id) || levels.get(p.id) !== nl) {
          levels.set(p.id, nl);
          changed = true;
        }
      }
    }
  }

  // For each spouse pair, align levels (so they show side-by-side)
  // A spouse without parents in tree should match level of their partner
  for (const [, pair] of spousePairs.entries()) {
    const aLvl = levels.get(pair.personId);
    const bLvl = levels.get(pair.spouseId);
    if (aLvl !== undefined && bLvl === undefined) levels.set(pair.spouseId, aLvl);
    else if (bLvl !== undefined && aLvl === undefined) levels.set(pair.personId, bLvl);
    else if (aLvl !== undefined && bLvl !== undefined && aLvl !== bLvl) {
      // align to the higher level (closer to root)
      const minL = Math.min(aLvl, bLvl);
      levels.set(pair.personId, minL);
      levels.set(pair.spouseId, minL);
    }
  }
  for (const p of persons) if (!levels.has(p.id)) levels.set(p.id, 0);

  // Group by level
  const byLevel = new Map();
  for (const p of persons) {
    const l = levels.get(p.id);
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l).push(p);
  }

  // Sort within level: place spouses adjacent
  const positionAtLevel = new Map();
  for (const [level, ppl] of byLevel.entries()) {
    // Sort: try to put spouses next to each other & siblings grouped
    const placed = new Set();
    const ordered = [];

    // For each person not yet placed
    for (const p of ppl) {
      if (placed.has(p.id)) continue;
      ordered.push(p);
      placed.add(p.id);

      // Find their spouse at same level and add immediately after
      for (const [, pair] of spousePairs.entries()) {
        const spouseId = pair.personId === p.id ? pair.spouseId : (pair.spouseId === p.id ? pair.personId : null);
        if (spouseId && ppl.find(x => x.id === spouseId) && !placed.has(spouseId)) {
          ordered.push(ppl.find(x => x.id === spouseId));
          placed.add(spouseId);
        }
      }
    }

    ordered.forEach((p, i) => positionAtLevel.set(p.id, { level, idx: i, total: ordered.length }));
    byLevel.set(level, ordered);
  }

  // Build nodes
  const nodes = [];
  const HORIZ = 230;
  const VERT = 210;

  for (const [level, ppl] of byLevel.entries()) {
    const totalWidth = (ppl.length - 1) * HORIZ;
    ppl.forEach((p, i) => {
      // Find this person's couple color (if they're a parent in some couple)
      const asParent = Array.from(coupleMap.values()).find(
        c => c.fatherId === p.id || c.motherId === p.id
      );
      const personColor = asParent ? asParent.color : '#1a1614';

      nodes.push({
        id: p.id,
        type: 'default',
        position: { x: i * HORIZ - totalWidth / 2, y: level * VERT },
        data: {
          label: (
            <div className="text-center px-2 py-1">
              <div className="text-xs font-semibold leading-tight">{p.fullName}</div>
              <div className="text-[10px] mt-1" style={{ opacity: 0.6 }}>
                {p.gender === 'male' ? '♂' : '♀'} {p.isAlive ? '' : '✝ deceased'}
              </div>
              {!p.isMuslim && (
                <div className="text-[9px] mt-0.5" style={{ opacity: 0.5 }}>(non-Muslim)</div>
              )}
            </div>
          ),
        },
        style: {
          background: p.isAlive ? 'white' : '#faf0e8',
          border: `2px solid ${p.isAlive ? personColor : '#b85c3a'}`,
          borderRadius: 4,
          width: 180,
          padding: 6,
          fontSize: 12,
          boxShadow: '0 2px 8px rgba(26,22,20,0.08)',
        },
      });
    });
  }

  // Build edges
  const edges = [];
  let edgeIdx = 0;

  // 1. Spouse connections — horizontal pink line with heart symbol via floating edge
  for (const [, pair] of spousePairs.entries()) {
    if (!personIds.has(pair.personId) || !personIds.has(pair.spouseId)) continue;
    edges.push({
      id: `spouse-${edgeIdx++}`,
      source: pair.personId,
      target: pair.spouseId,
      type: 'straight',
      style: {
        stroke: '#c8669e',
        strokeWidth: 2.5,
        strokeDasharray: '0',
      },
      label: '♥',
      labelStyle: { fill: '#c8669e', fontSize: 16, fontWeight: 700 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 10,
      labelBgStyle: { fill: 'white', stroke: '#c8669e', strokeWidth: 1 },
    });
  }

  // 2. Parent → child edges, colored by couple
  for (const [, couple] of coupleMap.entries()) {
    const { color, fatherId, motherId, children } = couple;
    for (const child of children) {
      if (fatherId && personIds.has(fatherId)) {
        edges.push({
          id: `e${edgeIdx++}`,
          source: fatherId,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        });
      }
      if (motherId && personIds.has(motherId)) {
        edges.push({
          id: `e${edgeIdx++}`,
          source: motherId,
          target: child.id,
          type: 'smoothstep',
          style: { stroke: color, strokeWidth: 2, strokeDasharray: '5,5' },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        });
      }
    }
  }

  // Color legend
  const legend = [];
  for (const [, couple] of coupleMap.entries()) {
    const father = persons.find(p => p.id === couple.fatherId);
    const mother = persons.find(p => p.id === couple.motherId);
    if (!father && !mother) continue;
    legend.push({
      color: couple.color,
      label: [father?.fullName, mother?.fullName].filter(Boolean).join(' & ') + ` (${couple.children.length})`,
      childCount: couple.children.length,
    });
  }

  return { nodes, edges, legend };
}

export default function FamilyTreeView({ persons, spouses }) {
  const { nodes, edges, legend } = useMemo(
    () => buildLayout(persons || [], spouses || []),
    [persons, spouses]
  );

  if (!persons || persons.length === 0) {
    return (
      <div className="card p-16 text-center">
        <div className="display-font italic text-2xl opacity-60 mb-3">Your family tree is empty.</div>
        <p className="opacity-70 text-sm">Add people to see the tree visualization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden" style={{ height: 600 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={true}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1a1614" gap={20} size={1} style={{ opacity: 0.05 }} />
          <Controls showInteractive={false} />
          <MiniMap nodeColor={() => '#6b7a5a'} maskColor="rgba(245, 240, 232, 0.7)" />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="card p-5">
        <div className="text-xs tracking-[0.2em] uppercase opacity-60 font-semibold mb-3">
          🗝 Tree Legend
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div style={{ width: 30, height: 2.5, background: '#c8669e' }} />
              <span style={{ color: '#c8669e' }}>♥</span>
            </div>
            <span>Marriage / Spouse connection</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="border-2" style={{ width: 16, height: 12, borderColor: '#b85c3a' }} />
            <span>Deceased member</span>
          </div>
        </div>

        {legend.length > 0 && (
          <>
            <div className="text-xs tracking-[0.2em] uppercase opacity-60 font-semibold mb-3 mt-4">
              👨‍👩‍👧 Couples — each family unit has a unique color
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {legend.map((l, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="flex flex-col gap-1 shrink-0">
                    <div style={{ width: 28, height: 2, background: l.color }} />
                    <div style={{ width: 28, height: 0, borderTop: `2px dashed ${l.color}` }} />
                  </div>
                  <span className="truncate">{l.label}</span>
                </div>
              ))}
            </div>
            <div className="text-xs opacity-50 mt-3 italic">
              Solid line = father's line · Dashed line = mother's line
            </div>
          </>
        )}
      </div>
    </div>
  );
}
