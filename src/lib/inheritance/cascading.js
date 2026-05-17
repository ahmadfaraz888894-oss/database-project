/**
 * CASCADING + MULTI-GENERATION PROJECTION (v3.1)
 */

import { calculateInheritance } from './calculator.js';

const MAX_DEPTH = 6;

export function calculateCascadingInheritance(
  deceased, allPersons, allSpouses, totalEstate, deductions = {}, options = {}
) {
  const mode = options.mode || 'representation';
  const orphanedLines = findOrphanedDescendantLines(deceased, allPersons, mode);

  if (mode === 'classical' || orphanedLines.length === 0) {
    const result = calculateInheritance(deceased, allPersons, allSpouses, totalEstate, deductions);
    return {
      ...result, mode, hasCascades: false, rawShares: result.shares,
      cascadeChain: (result.shares || []).map(s => ({
        level: 0, from: deceased.fullName, to: s.name, relationship: s.relationship,
        amount: s.amount, fraction: s.fraction, cascaded: false, reason: s.reason,
      })),
    };
  }

  const virtualPersons = allPersons.map(p =>
    orphanedLines.some(o => o.id === p.id) ? { ...p, isAlive: true, _wasResurrected: true } : p
  );
  const baseResult = calculateInheritance(deceased, virtualPersons, allSpouses, totalEstate, deductions);
  if (baseResult.error) return baseResult;

  const finalShares = [];
  const cascadeChain = [];
  for (const share of baseResult.shares) {
    cascadeShare(share, 0, [deceased.fullName], allPersons, allSpouses, finalShares, cascadeChain);
  }

  return {
    ...baseResult, mode,
    shares: aggregateByPerson(finalShares),
    rawShares: baseResult.shares, cascadeChain,
    hasCascades: cascadeChain.some(c => c.cascaded),
  };
}

function findOrphanedDescendantLines(person, allPersons, mode) {
  if (mode === 'classical') return [];
  const directChildren = allPersons.filter(
    p => (p.fatherId === person.id || p.motherId === person.id) && p.isMuslim
  );
  const orphaned = [];
  for (const child of directChildren) {
    if (!child.isAlive && hasLivingDescendants(child, allPersons)) orphaned.push(child);
  }
  return orphaned;
}

function hasLivingDescendants(person, allPersons) {
  const kids = allPersons.filter(
    p => (p.fatherId === person.id || p.motherId === person.id) && p.isMuslim
  );
  for (const k of kids) {
    if (k.isAlive) return true;
    if (hasLivingDescendants(k, allPersons)) return true;
  }
  return false;
}

function cascadeShare(share, depth, ancestry, allPersons, allSpouses, finalShares, cascadeChain) {
  if (depth > MAX_DEPTH) {
    finalShares.push({ ...share, cascadedFrom: ancestry.slice(1).join(' → ') || null });
    return;
  }
  const recipient = allPersons.find(p => p.id === share.personId);
  if (recipient && recipient.isAlive) {
    finalShares.push({
      ...share, cascadedFrom: ancestry.length > 1 ? ancestry.slice(1).join(' → ') : null, cascadeDepth: depth,
    });
    cascadeChain.push({
      level: depth, from: ancestry[ancestry.length - 1], to: share.name,
      relationship: share.relationship, amount: share.amount, fraction: share.fraction,
      cascaded: depth > 0, reason: share.reason,
    });
    return;
  }
  if (!recipient) {
    finalShares.push({ ...share, cascadedFrom: ancestry.slice(1).join(' → ') || null });
    return;
  }
  cascadeChain.push({
    level: depth, from: ancestry[ancestry.length - 1], to: share.name,
    relationship: share.relationship, amount: share.amount, fraction: share.fraction,
    cascaded: depth > 0, isDeceased: true,
    reason: `${share.name} predeceased the testator. Their share cascades to their heirs.`,
  });
  const subOrphaned = findOrphanedDescendantLines(recipient, allPersons, 'representation');
  const subVirtualPersons = allPersons.map(p =>
    subOrphaned.some(o => o.id === p.id) ? { ...p, isAlive: true } : p
  );
  const subResult = calculateInheritance(
    recipient, subVirtualPersons, allSpouses, share.amount,
    { funeralCost: 0, debts: 0, bequest: 0 }
  );
  if (subResult.error || !subResult.shares || subResult.shares.length === 0) {
    finalShares.push({
      ...share, name: `${share.name}'s line (no heirs)`,
      cascadedFrom: ancestry.slice(1).join(' → ') || null, noHeirs: true,
    });
    return;
  }
  for (const subShare of subResult.shares) {
    cascadeShare(
      { ...subShare, reason: `via ${recipient.fullName}: ${subShare.reason}` },
      depth + 1, [...ancestry, recipient.fullName],
      allPersons, allSpouses, finalShares, cascadeChain
    );
  }
}

function aggregateByPerson(shares) {
  const map = new Map();
  for (const s of shares) {
    const key = s.personId + '|' + s.relationship;
    if (map.has(key)) {
      const existing = map.get(key);
      existing.amount += s.amount;
      existing.fractionDecimal = (existing.fractionDecimal || 0) + (s.fractionDecimal || 0);
      existing.percentage = (existing.fractionDecimal * 100).toFixed(4);
    } else {
      map.set(key, { ...s });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

/**
 * MULTI-GENERATION PROJECTION
 * Even when heirs are alive, project what their children would eventually get.
 */
const MAX_PROJECTION_DEPTH = 3;

export function calculateMultiGenerationProjection(
  deceased, allPersons, allSpouses, totalEstate, deductions = {}, options = {}
) {
  const primaryResult = calculateCascadingInheritance(
    deceased, allPersons, allSpouses, totalEstate, deductions, options
  );
  if (primaryResult.error) return primaryResult;

  const branches = (primaryResult.shares || []).map(share =>
    buildBranch(share, allPersons, allSpouses, 1)
  );

  return {
    ...primaryResult,
    multiGeneration: {
      root: {
        name: deceased.fullName,
        netEstate: primaryResult.netEstate,
        totalEstate: primaryResult.totalEstate,
      },
      branches,
    },
  };
}

function buildBranch(share, allPersons, allSpouses, depth) {
  const heir = allPersons.find(p => p.id === share.personId);
  const branch = {
    heirId: share.personId,
    heirName: share.name,
    relationship: share.relationship,
    fraction: share.fraction,
    fractionDecimal: share.fractionDecimal,
    percentage: share.percentage,
    amount: share.amount,
    reason: share.reason,
    cascadedFrom: share.cascadedFrom,
    isAlive: heir?.isAlive !== false,
    depth,
    subDistribution: null,
  };

  if (depth >= MAX_PROJECTION_DEPTH || !heir) return branch;

  const hasChildren = allPersons.some(p =>
    (p.fatherId === heir.id || p.motherId === heir.id) && p.isMuslim
  );
  const hasSpouse = allSpouses.some(s =>
    (s.personId === heir.id || s.spouseId === heir.id) && s.isActive
  );

  // Only project if this heir has actual descendants worth showing
  if (!hasChildren && !hasSpouse) return branch;

  const virtualPersons = allPersons.map(p =>
    p.id === heir.id ? { ...p, isAlive: false } : p
  );
  const virtualHeir = { ...heir, isAlive: false };

  const subResult = calculateInheritance(
    virtualHeir, virtualPersons, allSpouses, share.amount,
    { funeralCost: 0, debts: 0, bequest: 0 }
  );

  if (subResult.error || !subResult.shares || subResult.shares.length === 0) {
    return branch;
  }

  branch.subDistribution = {
    heirsCount: subResult.shares.length,
    note: heir.isAlive
      ? `If ${heir.fullName} also passes away, their ₨${Math.round(share.amount).toLocaleString()} would distribute as:`
      : `${heir.fullName} (deceased) — share cascades to:`,
    branches: subResult.shares.map(s => buildBranch(s, allPersons, allSpouses, depth + 1)),
  };

  return branch;
}
