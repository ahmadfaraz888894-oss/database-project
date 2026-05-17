/**
 * ISLAMIC INHERITANCE CALCULATOR (Hanafi School)
 *
 * Implements Faraid (فرائض) - the science of inheritance in Islamic law.
 *
 * Calculation steps:
 * 1. Deduct from estate: funeral costs → debts → bequest (max 1/3 of remainder)
 * 2. Net estate is then distributed among heirs
 * 3. Identify Ashab al-Furud (fixed share heirs) and assign Quranic shares
 * 4. Apply Hajb (exclusion) rules - some heirs block others
 * 5. Apply Awl (proportional reduction if shares exceed 1)
 * 6. Distribute residue to Asabat (residuaries)
 * 7. Apply Radd (proportional return if shares less than 1 and no Asabat)
 *
 * Uses Fraction.js for exact rational arithmetic (no floating point errors).
 */

import Fraction from 'fraction.js';
import { identifyHeirs } from './heirs.js';

/**
 * Determine if descendants exist (children or agnatic grandchildren)
 * Many fixed shares depend on this
 */
function hasDescendants(heirs) {
  return (
    heirs.sons.length > 0 ||
    heirs.daughters.length > 0 ||
    heirs.grandsons.length > 0 ||
    heirs.granddaughters.length > 0
  );
}

/**
 * Determine if male descendants exist (sons or grandsons through sons)
 * This affects daughters' status (fixed share vs. residuary)
 */
function hasMaleDescendants(heirs) {
  return heirs.sons.length > 0 || heirs.grandsons.length > 0;
}

/**
 * Count multiple siblings/children for "two or more" rules
 */
function countSiblings(heirs) {
  return (
    heirs.fullBrothers.length +
    heirs.fullSisters.length +
    heirs.consanguineBrothers.length +
    heirs.consanguineSisters.length +
    heirs.uterineSiblings.length
  );
}

/**
 * Calculate inheritance shares
 * Returns: { shares: [{personId, name, fraction, reason, category}], totalDistributed, residue, awl, radd }
 */
export function calculateInheritance(deceased, allPersons, allSpouses, totalEstate, deductions = {}) {
  const { funeralCost = 0, debts = 0, bequest = 0 } = deductions;

  // ─── Step 1: Calculate net distributable estate ───
  const afterFuneral = totalEstate - funeralCost;
  const afterDebts = afterFuneral - debts;

  // Bequest (wasiyyah) is limited to 1/3 of (estate - funeral - debts)
  const maxBequest = afterDebts / 3;
  const effectiveBequest = Math.min(bequest, maxBequest);
  const netEstate = afterDebts - effectiveBequest;

  // Edge cases
  if (deceased.isAlive) {
    return { error: 'Cannot calculate inheritance for a living person' };
  }
  if (netEstate <= 0) {
    return {
      error: 'No estate remaining after deductions',
      totalEstate,
      funeralCost,
      debts,
      bequest: effectiveBequest,
      netEstate: 0,
      shares: [],
    };
  }

  // ─── Step 2: Identify heirs ───
  const heirs = identifyHeirs(deceased, allPersons, allSpouses);
  const fixedShares = []; // Ashab al-Furud
  const residuaries = []; // Asabat

  const hasDesc = hasDescendants(heirs);
  const hasMaleDesc = hasMaleDescendants(heirs);
  const siblingCount = countSiblings(heirs);

  // ─── Step 3: Assign fixed shares (Quranic shares) ───

  // ─── HUSBAND ─── (woman's husband inherits)
  if (heirs.husband) {
    fixedShares.push({
      personId: heirs.husband.id,
      name: heirs.husband.fullName,
      relationship: 'Husband',
      fraction: hasDesc ? new Fraction(1, 4) : new Fraction(1, 2),
      reason: hasDesc
        ? 'Husband gets 1/4 when deceased has descendants'
        : 'Husband gets 1/2 when deceased has no descendants',
      category: 'fixed',
    });
  }

  // ─── WIVES ─── (man's wives share 1/8 or 1/4)
  if (heirs.wives.length > 0) {
    const wivesShare = hasDesc ? new Fraction(1, 8) : new Fraction(1, 4);
    const perWife = wivesShare.div(heirs.wives.length);
    for (const wife of heirs.wives) {
      fixedShares.push({
        personId: wife.id,
        name: wife.fullName,
        relationship: 'Wife',
        fraction: perWife,
        reason: hasDesc
          ? `Wives share 1/8 when deceased has descendants (divided among ${heirs.wives.length})`
          : `Wives share 1/4 when deceased has no descendants (divided among ${heirs.wives.length})`,
        category: 'fixed',
      });
    }
  }

  // ─── FATHER ───
  if (heirs.father) {
    if (hasMaleDesc) {
      // Father gets 1/6 only (fixed share) - male descendant takes residue
      fixedShares.push({
        personId: heirs.father.id,
        name: heirs.father.fullName,
        relationship: 'Father',
        fraction: new Fraction(1, 6),
        reason: 'Father gets 1/6 when deceased has male descendants',
        category: 'fixed',
      });
    } else if (hasDesc) {
      // Only female descendants - father gets 1/6 fixed + residue
      fixedShares.push({
        personId: heirs.father.id,
        name: heirs.father.fullName,
        relationship: 'Father',
        fraction: new Fraction(1, 6),
        reason: 'Father gets 1/6 + residue (only female descendants)',
        category: 'fixed-and-residue',
      });
      residuaries.push({
        personId: heirs.father.id,
        name: heirs.father.fullName,
        relationship: 'Father',
        priority: 0,
        type: 'father',
      });
    } else {
      // No descendants - father is pure residuary
      residuaries.push({
        personId: heirs.father.id,
        name: heirs.father.fullName,
        relationship: 'Father',
        priority: 0,
        type: 'father',
      });
    }
  }

  // ─── PATERNAL GRANDFATHER ─── (only inherits if father is absent)
  if (!heirs.father && heirs.paternalGrandfather) {
    if (hasMaleDesc) {
      fixedShares.push({
        personId: heirs.paternalGrandfather.id,
        name: heirs.paternalGrandfather.fullName,
        relationship: 'Paternal Grandfather',
        fraction: new Fraction(1, 6),
        reason: 'Grandfather gets 1/6 in absence of father, with male descendants',
        category: 'fixed',
      });
    } else if (hasDesc) {
      fixedShares.push({
        personId: heirs.paternalGrandfather.id,
        name: heirs.paternalGrandfather.fullName,
        relationship: 'Paternal Grandfather',
        fraction: new Fraction(1, 6),
        reason: 'Grandfather gets 1/6 + residue (only female descendants)',
        category: 'fixed-and-residue',
      });
      residuaries.push({
        personId: heirs.paternalGrandfather.id,
        name: heirs.paternalGrandfather.fullName,
        relationship: 'Paternal Grandfather',
        priority: 1,
        type: 'grandfather',
      });
    } else {
      residuaries.push({
        personId: heirs.paternalGrandfather.id,
        name: heirs.paternalGrandfather.fullName,
        relationship: 'Paternal Grandfather',
        priority: 1,
        type: 'grandfather',
      });
    }
  }

  // ─── MOTHER ───
  if (heirs.mother) {
    let motherFraction;
    let motherReason;

    if (hasDesc || siblingCount >= 2) {
      motherFraction = new Fraction(1, 6);
      motherReason = hasDesc
        ? 'Mother gets 1/6 when deceased has descendants'
        : 'Mother gets 1/6 when deceased has 2+ siblings';
    } else {
      // Umariyyatan (special cases): if heirs are spouse + mother + father only,
      // mother gets 1/3 of the REMAINDER after spouse, not 1/3 of total
      const onlySpouseAndParents =
        (heirs.husband || heirs.wives.length > 0) &&
        heirs.father &&
        !hasDesc &&
        siblingCount === 0 &&
        heirs.fullBrothers.length === 0 &&
        heirs.fullSisters.length === 0;

      if (onlySpouseAndParents) {
        // Mother gets 1/3 of remainder after spouse share
        const spouseShare = heirs.husband ? new Fraction(1, 2) : new Fraction(1, 4);
        const remainder = new Fraction(1).sub(spouseShare);
        motherFraction = remainder.div(3);
        motherReason = 'Mother gets 1/3 of remainder after spouse (Umariyyatan rule)';
      } else {
        motherFraction = new Fraction(1, 3);
        motherReason = 'Mother gets 1/3 (no descendants, fewer than 2 siblings)';
      }
    }

    fixedShares.push({
      personId: heirs.mother.id,
      name: heirs.mother.fullName,
      relationship: 'Mother',
      fraction: motherFraction,
      reason: motherReason,
      category: 'fixed',
    });
  }

  // ─── GRANDMOTHERS ─── (1/6 shared, only if mother absent)
  if (!heirs.mother && heirs.grandmothers.length > 0) {
    const perGM = new Fraction(1, 6).div(heirs.grandmothers.length);
    for (const gm of heirs.grandmothers) {
      fixedShares.push({
        personId: gm.id,
        name: gm.fullName,
        relationship: 'Grandmother',
        fraction: perGM,
        reason: `Grandmother(s) share 1/6 in absence of mother (${heirs.grandmothers.length} grandmother${heirs.grandmothers.length > 1 ? 's' : ''})`,
        category: 'fixed',
      });
    }
  }

  // ─── DAUGHTERS ─── (with sons → residuary 2:1; alone → fixed share)
  if (heirs.daughters.length > 0) {
    if (heirs.sons.length > 0) {
      // With sons: daughters become residuary, share 2:1 with sons (handled below)
    } else {
      // No sons: fixed share
      if (heirs.daughters.length === 1) {
        fixedShares.push({
          personId: heirs.daughters[0].id,
          name: heirs.daughters[0].fullName,
          relationship: 'Daughter',
          fraction: new Fraction(1, 2),
          reason: 'One daughter alone gets 1/2',
          category: 'fixed',
        });
      } else {
        // 2 or more daughters share 2/3
        const perDaughter = new Fraction(2, 3).div(heirs.daughters.length);
        for (const d of heirs.daughters) {
          fixedShares.push({
            personId: d.id,
            name: d.fullName,
            relationship: 'Daughter',
            fraction: perDaughter,
            reason: `${heirs.daughters.length} daughters share 2/3`,
            category: 'fixed',
          });
        }
      }
    }
  }

  // ─── SONS ─── always residuary
  if (heirs.sons.length > 0) {
    for (const son of heirs.sons) {
      residuaries.push({
        personId: son.id,
        name: son.fullName,
        relationship: 'Son',
        priority: -1, // sons take precedence over all other residuaries
        type: 'son',
        weight: 2, // sons get double share
      });
    }
    // Daughters with sons: also residuary, weight 1
    for (const d of heirs.daughters) {
      residuaries.push({
        personId: d.id,
        name: d.fullName,
        relationship: 'Daughter',
        priority: -1,
        type: 'daughter-with-son',
        weight: 1,
      });
    }
  }

  // ─── GRANDDAUGHTERS (through son) ─── only if no sons
  if (heirs.sons.length === 0 && heirs.granddaughters.length > 0) {
    if (heirs.grandsons.length === 0) {
      // No grandsons - granddaughters get fixed shares
      if (heirs.daughters.length === 0) {
        // No daughters either
        if (heirs.granddaughters.length === 1) {
          fixedShares.push({
            personId: heirs.granddaughters[0].id,
            name: heirs.granddaughters[0].fullName,
            relationship: 'Granddaughter (son\'s daughter)',
            fraction: new Fraction(1, 2),
            reason: 'One granddaughter (no sons, no daughters) gets 1/2',
            category: 'fixed',
          });
        } else {
          const perGD = new Fraction(2, 3).div(heirs.granddaughters.length);
          for (const gd of heirs.granddaughters) {
            fixedShares.push({
              personId: gd.id,
              name: gd.fullName,
              relationship: 'Granddaughter (son\'s daughter)',
              fraction: perGD,
              reason: `${heirs.granddaughters.length} granddaughters share 2/3`,
              category: 'fixed',
            });
          }
        }
      } else if (heirs.daughters.length === 1) {
        // One daughter takes 1/2, granddaughters share 1/6 (completes 2/3)
        const perGD = new Fraction(1, 6).div(heirs.granddaughters.length);
        for (const gd of heirs.granddaughters) {
          fixedShares.push({
            personId: gd.id,
            name: gd.fullName,
            relationship: 'Granddaughter (son\'s daughter)',
            fraction: perGD,
            reason: 'Granddaughters share 1/6 to complete 2/3 (one daughter present)',
            category: 'fixed',
          });
        }
      }
      // If 2+ daughters present, granddaughters are excluded (unless grandson present)
    }
  }

  // ─── GRANDSONS (through son) ─── residuary if no sons
  if (heirs.sons.length === 0 && heirs.grandsons.length > 0) {
    for (const gs of heirs.grandsons) {
      residuaries.push({
        personId: gs.id,
        name: gs.fullName,
        relationship: 'Grandson (son\'s son)',
        priority: -1,
        type: 'grandson',
        weight: 2,
      });
    }
    // Granddaughters with grandsons - residuary, weight 1
    for (const gd of heirs.granddaughters) {
      residuaries.push({
        personId: gd.id,
        name: gd.fullName,
        relationship: 'Granddaughter (son\'s daughter)',
        priority: -1,
        type: 'granddaughter-with-grandson',
        weight: 1,
      });
    }
  }

  // ─── UTERINE SIBLINGS ─── (always fixed share, blocked by descendants/father/grandfather)
  const blockUterine = hasDesc || heirs.father || heirs.paternalGrandfather;
  if (!blockUterine && heirs.uterineSiblings.length > 0) {
    if (heirs.uterineSiblings.length === 1) {
      fixedShares.push({
        personId: heirs.uterineSiblings[0].id,
        name: heirs.uterineSiblings[0].fullName,
        relationship: 'Uterine sibling',
        fraction: new Fraction(1, 6),
        reason: 'One uterine sibling gets 1/6',
        category: 'fixed',
      });
    } else {
      // 2 or more share 1/3 equally (no gender distinction for uterine siblings)
      const perSibling = new Fraction(1, 3).div(heirs.uterineSiblings.length);
      for (const sib of heirs.uterineSiblings) {
        fixedShares.push({
          personId: sib.id,
          name: sib.fullName,
          relationship: 'Uterine sibling',
          fraction: perSibling,
          reason: `${heirs.uterineSiblings.length} uterine siblings share 1/3 equally`,
          category: 'fixed',
        });
      }
    }
  }

  // ─── FULL SIBLINGS ─── (blocked by son, grandson, father)
  const blockFullSiblings = heirs.sons.length > 0 || heirs.grandsons.length > 0 || heirs.father;
  if (!blockFullSiblings) {
    if (heirs.fullBrothers.length > 0) {
      // Full brothers are residuary; full sisters with them also residuary (2:1)
      for (const fb of heirs.fullBrothers) {
        residuaries.push({
          personId: fb.id,
          name: fb.fullName,
          relationship: 'Full brother',
          priority: 2,
          type: 'full-brother',
          weight: 2,
        });
      }
      for (const fs of heirs.fullSisters) {
        residuaries.push({
          personId: fs.id,
          name: fs.fullName,
          relationship: 'Full sister',
          priority: 2,
          type: 'full-sister-with-brother',
          weight: 1,
        });
      }
    } else if (heirs.fullSisters.length > 0) {
      // No full brothers - full sisters may be fixed or residuary
      if (heirs.daughters.length > 0 || heirs.granddaughters.length > 0) {
        // Full sisters become residuary "with daughters" (asaba ma'a al-ghayr)
        for (const fs of heirs.fullSisters) {
          residuaries.push({
            personId: fs.id,
            name: fs.fullName,
            relationship: 'Full sister',
            priority: 3,
            type: 'full-sister-with-daughter',
            weight: 1,
          });
        }
      } else {
        // Pure fixed share for full sisters
        if (heirs.fullSisters.length === 1) {
          fixedShares.push({
            personId: heirs.fullSisters[0].id,
            name: heirs.fullSisters[0].fullName,
            relationship: 'Full sister',
            fraction: new Fraction(1, 2),
            reason: 'One full sister gets 1/2',
            category: 'fixed',
          });
        } else {
          const perFS = new Fraction(2, 3).div(heirs.fullSisters.length);
          for (const fs of heirs.fullSisters) {
            fixedShares.push({
              personId: fs.id,
              name: fs.fullName,
              relationship: 'Full sister',
              fraction: perFS,
              reason: `${heirs.fullSisters.length} full sisters share 2/3`,
              category: 'fixed',
            });
          }
        }
      }
    }
  }

  // ─── CONSANGUINE SIBLINGS ─── (blocked also by full brother)
  const blockConsanguine =
    blockFullSiblings ||
    heirs.fullBrothers.length > 0 ||
    (heirs.fullSisters.length >= 2 && heirs.daughters.length === 0); // 2+ full sisters who took 2/3
  if (!blockConsanguine) {
    if (heirs.consanguineBrothers.length > 0) {
      for (const cb of heirs.consanguineBrothers) {
        residuaries.push({
          personId: cb.id,
          name: cb.fullName,
          relationship: 'Consanguine brother',
          priority: 4,
          type: 'consanguine-brother',
          weight: 2,
        });
      }
      for (const cs of heirs.consanguineSisters) {
        residuaries.push({
          personId: cs.id,
          name: cs.fullName,
          relationship: 'Consanguine sister',
          priority: 4,
          type: 'consanguine-sister-with-brother',
          weight: 1,
        });
      }
    } else if (heirs.consanguineSisters.length > 0) {
      if (heirs.daughters.length > 0 || heirs.granddaughters.length > 0) {
        for (const cs of heirs.consanguineSisters) {
          residuaries.push({
            personId: cs.id,
            name: cs.fullName,
            relationship: 'Consanguine sister',
            priority: 5,
            type: 'consanguine-sister-with-daughter',
            weight: 1,
          });
        }
      } else {
        // Check if one full sister took 1/2 - then consanguine sister(s) get 1/6 to complete 2/3
        const hasOneFullSister =
          heirs.fullSisters.length === 1 &&
          heirs.daughters.length === 0 &&
          heirs.granddaughters.length === 0;
        if (hasOneFullSister) {
          const perCS = new Fraction(1, 6).div(heirs.consanguineSisters.length);
          for (const cs of heirs.consanguineSisters) {
            fixedShares.push({
              personId: cs.id,
              name: cs.fullName,
              relationship: 'Consanguine sister',
              fraction: perCS,
              reason: 'Consanguine sister(s) share 1/6 to complete 2/3 with full sister',
              category: 'fixed',
            });
          }
        } else if (heirs.consanguineSisters.length === 1) {
          fixedShares.push({
            personId: heirs.consanguineSisters[0].id,
            name: heirs.consanguineSisters[0].fullName,
            relationship: 'Consanguine sister',
            fraction: new Fraction(1, 2),
            reason: 'One consanguine sister gets 1/2',
            category: 'fixed',
          });
        } else {
          const perCS = new Fraction(2, 3).div(heirs.consanguineSisters.length);
          for (const cs of heirs.consanguineSisters) {
            fixedShares.push({
              personId: cs.id,
              name: cs.fullName,
              relationship: 'Consanguine sister',
              fraction: perCS,
              reason: `${heirs.consanguineSisters.length} consanguine sisters share 2/3`,
              category: 'fixed',
            });
          }
        }
      }
    }
  }

  // ─── Step 4: Sum fixed shares ───
  let totalFixed = new Fraction(0);
  for (const share of fixedShares) {
    totalFixed = totalFixed.add(share.fraction);
  }

  // ─── Step 5: AWL ─── (if sum > 1, reduce all proportionally)
  let awlApplied = false;
  let awlFactor = new Fraction(1);
  if (totalFixed.compare(1) > 0) {
    awlApplied = true;
    awlFactor = new Fraction(1).div(totalFixed);
    for (const share of fixedShares) {
      share.originalFraction = share.fraction;
      share.fraction = share.fraction.mul(awlFactor);
    }
    totalFixed = new Fraction(1);
  }

  // ─── Step 6: Distribute residue to Asabat ───
  const residue = new Fraction(1).sub(totalFixed);
  let residueDistributed = new Fraction(0);

  if (residue.compare(0) > 0 && residuaries.length > 0) {
    // Sort by priority (lower = higher priority); take highest priority group only
    const minPriority = Math.min(...residuaries.map(r => r.priority));
    const activeResiduaries = residuaries.filter(r => r.priority === minPriority);

    const totalWeight = activeResiduaries.reduce((sum, r) => sum + (r.weight || 1), 0);

    for (const r of activeResiduaries) {
      const share = residue.mul(r.weight || 1).div(totalWeight);
      // Check if already has fixed share (e.g., father with only female descendants)
      const existing = fixedShares.find(
        f => f.personId === r.personId && f.category === 'fixed-and-residue'
      );
      if (existing) {
        existing.fraction = existing.fraction.add(share);
        existing.reason += ` + ${share.toFraction(true)} residue`;
      } else {
        fixedShares.push({
          personId: r.personId,
          name: r.name,
          relationship: r.relationship,
          fraction: share,
          reason: `Residue (Asabat) as ${r.relationship}`,
          category: 'residue',
        });
      }
      residueDistributed = residueDistributed.add(share);
    }
  }

  // ─── Step 7: RADD ─── (if no residuaries took residue and there's leftover)
  let raddApplied = false;
  const totalGiven = totalFixed.add(residueDistributed);
  if (totalGiven.compare(1) < 0) {
    // Spouses do NOT participate in Radd (Hanafi view)
    const raddEligible = fixedShares.filter(
      f =>
        f.relationship !== 'Husband' &&
        f.relationship !== 'Wife' &&
        f.category !== 'residue'
    );

    if (raddEligible.length > 0) {
      raddApplied = true;
      const eligibleSum = raddEligible.reduce(
        (sum, f) => sum.add(f.fraction),
        new Fraction(0)
      );
      const remainder = new Fraction(1).sub(totalGiven);

      // Distribute remainder proportionally among eligible heirs
      for (const f of raddEligible) {
        const addition = remainder.mul(f.fraction).div(eligibleSum);
        f.fraction = f.fraction.add(addition);
        f.reason += ' (+ Radd)';
      }
    }
  }

  // ─── Step 8: Convert to monetary amounts ───
  const finalShares = fixedShares.map(s => {
    const amount = s.fraction.valueOf() * netEstate;
    return {
      personId: s.personId,
      name: s.name,
      relationship: s.relationship,
      fraction: s.fraction.toFraction(true),
      fractionDecimal: s.fraction.valueOf(),
      percentage: (s.fraction.valueOf() * 100).toFixed(4),
      amount: amount,
      reason: s.reason,
      category: s.category,
    };
  });

  // ─── Step 9: Detect when no heirs exist ───
  if (finalShares.length === 0) {
    return {
      totalEstate,
      funeralCost,
      debts,
      bequest: effectiveBequest,
      netEstate,
      shares: [],
      awlApplied,
      raddApplied,
      warning: 'No eligible heirs identified. Estate goes to Bayt al-Mal (public treasury) or distant relatives (Dhawu al-Arham).',
    };
  }

  return {
    totalEstate,
    funeralCost,
    debts,
    bequest: effectiveBequest,
    netEstate,
    shares: finalShares,
    awlApplied,
    awlFactor: awlApplied ? awlFactor.toFraction(true) : null,
    raddApplied,
    deceased: {
      id: deceased.id,
      name: deceased.fullName,
    },
  };
}
