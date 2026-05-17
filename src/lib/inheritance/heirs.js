/**
 * HEIR IDENTIFICATION (Hanafi Fiqh)
 *
 * This module identifies all eligible heirs of a deceased person based on
 * Islamic inheritance law (Faraid). It builds a structured heir object from
 * the family tree relationships stored in the database.
 *
 * Key principles applied:
 * - Non-Muslims do not inherit from Muslims
 * - Killers do not inherit from their victims (not implemented - rare edge case)
 * - Slaves do not inherit (not relevant today)
 * - Only living persons at moment of death inherit
 *
 * Hanafi school recognizes 3 categories of heirs:
 *   1. Ashab al-Furud (sharers with fixed shares from Quran)
 *   2. Asabat (residuaries - male agnatic relatives)
 *   3. Dhawu al-Arham (distant relatives - inherit only if no above heirs)
 */

/**
 * Get all children of a person, separated by gender and alive status
 */
function getChildren(person, allPersons) {
  const children = allPersons.filter(
    p => (p.fatherId === person.id || p.motherId === person.id) && p.isMuslim
  );

  return {
    sons: children.filter(c => c.gender === 'male' && c.isAlive),
    daughters: children.filter(c => c.gender === 'female' && c.isAlive),
    deceasedSons: children.filter(c => c.gender === 'male' && !c.isAlive),
    deceasedDaughters: children.filter(c => c.gender === 'female' && !c.isAlive),
    all: children,
  };
}

/**
 * Get grandchildren through sons only (agnatic descendants)
 * In Hanafi fiqh, only descendants through sons inherit from grandfather
 */
function getAgnaticGrandchildren(person, allPersons) {
  const sonsAll = allPersons.filter(
    p => p.fatherId === person.id && p.gender === 'male'
  );

  const grandsons = [];
  const granddaughters = [];

  for (const son of sonsAll) {
    if (son.isAlive) continue; // Living sons block their children's inheritance
    const sonChildren = allPersons.filter(
      p => p.fatherId === son.id && p.isMuslim && p.isAlive
    );
    grandsons.push(...sonChildren.filter(c => c.gender === 'male'));
    granddaughters.push(...sonChildren.filter(c => c.gender === 'female'));
  }

  return { grandsons, granddaughters };
}

/**
 * Get living spouses of the deceased (at time of death)
 */
function getSpouses(person, allPersons, allSpouses) {
  const spouseRelations = allSpouses.filter(
    s => (s.personId === person.id || s.spouseId === person.id) && s.isActive
  );

  const spouses = [];
  for (const rel of spouseRelations) {
    const spouseId = rel.personId === person.id ? rel.spouseId : rel.personId;
    const spouse = allPersons.find(p => p.id === spouseId);
    if (spouse && spouse.isAlive && spouse.isMuslim) {
      spouses.push(spouse);
    }
  }
  return spouses;
}

/**
 * Get parents (father and mother) if alive
 */
function getParents(person, allPersons) {
  const father = person.fatherId
    ? allPersons.find(p => p.id === person.fatherId && p.isAlive && p.isMuslim)
    : null;
  const mother = person.motherId
    ? allPersons.find(p => p.id === person.motherId && p.isAlive && p.isMuslim)
    : null;
  return { father, mother };
}

/**
 * Get paternal grandfather (true grandfather - Jadd Sahih)
 * Walks up through father chain until finds living grandfather
 */
function getPaternalGrandfather(person, allPersons) {
  const father = person.fatherId
    ? allPersons.find(p => p.id === person.fatherId)
    : null;
  if (!father) return null;
  if (father.isAlive) return null; // Father blocks grandfather

  // Walk up the paternal line
  let current = father;
  while (current && current.fatherId) {
    const grandparent = allPersons.find(p => p.id === current.fatherId);
    if (!grandparent) return null;
    if (grandparent.isAlive && grandparent.isMuslim) return grandparent;
    current = grandparent;
  }
  return null;
}

/**
 * Get maternal & paternal grandmothers (only if mothers in chain are deceased)
 */
function getGrandmothers(person, allPersons) {
  const grandmothers = [];

  // Maternal grandmother (mother's mother)
  if (person.motherId) {
    const mother = allPersons.find(p => p.id === person.motherId);
    if (mother && !mother.isAlive && mother.motherId) {
      const matGM = allPersons.find(
        p => p.id === mother.motherId && p.isAlive && p.isMuslim
      );
      if (matGM) grandmothers.push(matGM);
    }
  }

  // Paternal grandmother (father's mother) - only if father is dead
  if (person.fatherId) {
    const father = allPersons.find(p => p.id === person.fatherId);
    if (father && !father.isAlive && father.motherId) {
      const patGM = allPersons.find(
        p => p.id === father.motherId && p.isAlive && p.isMuslim
      );
      if (patGM && !grandmothers.find(g => g.id === patGM.id)) {
        grandmothers.push(patGM);
      }
    }
  }

  return grandmothers;
}

/**
 * Get full siblings (same father and same mother)
 */
function getFullSiblings(person, allPersons) {
  if (!person.fatherId || !person.motherId) return { brothers: [], sisters: [] };

  const siblings = allPersons.filter(
    p =>
      p.id !== person.id &&
      p.fatherId === person.fatherId &&
      p.motherId === person.motherId &&
      p.isAlive &&
      p.isMuslim
  );

  return {
    brothers: siblings.filter(s => s.gender === 'male'),
    sisters: siblings.filter(s => s.gender === 'female'),
  };
}

/**
 * Get consanguine siblings (same father only)
 */
function getConsanguineSiblings(person, allPersons) {
  if (!person.fatherId) return { brothers: [], sisters: [] };

  const siblings = allPersons.filter(
    p =>
      p.id !== person.id &&
      p.fatherId === person.fatherId &&
      p.motherId !== person.motherId &&
      p.isAlive &&
      p.isMuslim
  );

  return {
    brothers: siblings.filter(s => s.gender === 'male'),
    sisters: siblings.filter(s => s.gender === 'female'),
  };
}

/**
 * Get uterine siblings (same mother only)
 */
function getUterineSiblings(person, allPersons) {
  if (!person.motherId) return { siblings: [] };

  const siblings = allPersons.filter(
    p =>
      p.id !== person.id &&
      p.motherId === person.motherId &&
      p.fatherId !== person.fatherId &&
      p.isAlive &&
      p.isMuslim
  );

  return { siblings };
}

/**
 * Main heir identification function
 * Returns structured object with all eligible heirs categorized
 */
export function identifyHeirs(deceased, allPersons, allSpouses) {
  const children = getChildren(deceased, allPersons);
  const grandchildren = getAgnaticGrandchildren(deceased, allPersons);
  const spouses = getSpouses(deceased, allPersons, allSpouses);
  const { father, mother } = getParents(deceased, allPersons);
  const paternalGrandfather = getPaternalGrandfather(deceased, allPersons);
  const grandmothers = getGrandmothers(deceased, allPersons);
  const fullSiblings = getFullSiblings(deceased, allPersons);
  const consanguineSiblings = getConsanguineSiblings(deceased, allPersons);
  const uterineSiblings = getUterineSiblings(deceased, allPersons);

  // Husbands and wives need to be separated for the calculator
  const husbands = spouses.filter(s => s.gender === 'male');
  const wives = spouses.filter(s => s.gender === 'female');

  return {
    deceased,
    husband: husbands[0] || null, // A woman has at most one husband at death
    wives, // A man can have up to 4 wives
    father,
    mother,
    paternalGrandfather,
    grandmothers,
    sons: children.sons,
    daughters: children.daughters,
    grandsons: grandchildren.grandsons,
    granddaughters: grandchildren.granddaughters,
    fullBrothers: fullSiblings.brothers,
    fullSisters: fullSiblings.sisters,
    consanguineBrothers: consanguineSiblings.brothers,
    consanguineSisters: consanguineSiblings.sisters,
    uterineSiblings: uterineSiblings.siblings,
  };
}
