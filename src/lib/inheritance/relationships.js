/**
 * RELATIONSHIP & ELIGIBILITY EXPLAINER
 *
 * For a given target person (looking up their share) and a deceased person,
 * explains:
 *   - What's their relationship in the family tree
 *   - Why they do or don't inherit
 *   - Who's blocking them (if anyone)
 *   - What would need to change for them to inherit
 *
 * Used by ShareLookup feature so user understands WHY someone gets nothing,
 * not just a flat "Not an heir" message.
 */

/**
 * Find the family-tree relationship of `target` to `deceased`.
 * Returns a label like "Grandson (through son Ahmed)" or "No traceable relationship".
 */
export function describeRelationship(target, deceased, allPersons) {
  if (!target || !deceased) return { label: 'Unknown', path: [] };

  // Direct relationships
  if (target.id === deceased.fatherId) return { label: 'Father', path: [deceased.id, target.id], pathLabels: ['Father'] };
  if (target.id === deceased.motherId) return { label: 'Mother', path: [deceased.id, target.id], pathLabels: ['Mother'] };
  if (target.fatherId === deceased.id || target.motherId === deceased.id) {
    return {
      label: target.gender === 'male' ? 'Son' : 'Daughter',
      path: [deceased.id, target.id],
      pathLabels: [target.gender === 'male' ? 'Son' : 'Daughter'],
    };
  }

  // Sibling check
  const sharedFather = target.fatherId && target.fatherId === deceased.fatherId;
  const sharedMother = target.motherId && target.motherId === deceased.motherId;
  if (sharedFather && sharedMother) {
    return { label: target.gender === 'male' ? 'Full brother' : 'Full sister' };
  }
  if (sharedFather) {
    return { label: target.gender === 'male' ? 'Consanguine brother (same father)' : 'Consanguine sister (same father)' };
  }
  if (sharedMother) {
    return { label: 'Uterine sibling (same mother)' };
  }

  // Grandparent check (target's grandparent = deceased)
  const targetFather = target.fatherId ? allPersons.find(p => p.id === target.fatherId) : null;
  const targetMother = target.motherId ? allPersons.find(p => p.id === target.motherId) : null;
  if (targetFather && targetFather.fatherId === deceased.id) {
    return {
      label: target.gender === 'male' ? `Grandson (through son ${targetFather.fullName})` : `Granddaughter (through son ${targetFather.fullName})`,
      throughParent: targetFather,
    };
  }
  if (targetFather && targetFather.motherId === deceased.id) {
    return {
      label: target.gender === 'male' ? `Grandson (through daughter ${targetFather.fullName}'s spouse)` : `Granddaughter (through daughter)`,
      throughParent: targetFather,
    };
  }
  if (targetMother && (targetMother.fatherId === deceased.id || targetMother.motherId === deceased.id)) {
    return {
      label: target.gender === 'male' ? `Grandson (through daughter ${targetMother.fullName})` : `Granddaughter (through daughter ${targetMother.fullName})`,
      throughParent: targetMother,
    };
  }

  // Grandchild going up (deceased is grandchild's grandparent)
  if (deceased.fatherId === target.id || deceased.motherId === target.id) {
    return { label: deceased.fatherId === target.id ? 'Grandfather' : 'Grandmother' };
  }

  // Try paternal grandfather
  const deceasedFather = deceased.fatherId ? allPersons.find(p => p.id === deceased.fatherId) : null;
  if (deceasedFather && deceasedFather.fatherId === target.id) {
    return { label: 'Paternal Grandfather' };
  }
  if (deceasedFather && deceasedFather.motherId === target.id) {
    return { label: 'Paternal Grandmother' };
  }

  // Spouse check (via spouse relationships - need allSpouses, simplified here)
  // Will be handled by lookup API

  // Uncle / aunt (sibling of deceased's parent)
  if (deceasedFather && (target.fatherId === deceasedFather.fatherId || target.motherId === deceasedFather.motherId)) {
    return { label: target.gender === 'male' ? 'Paternal uncle' : 'Paternal aunt' };
  }

  return { label: 'Distant relative or no traceable relationship' };
}

/**
 * Explain WHY someone with a given relationship doesn't inherit (Hanafi rules).
 */
export function explainNonInheritance(target, deceased, relationship, allPersons) {
  if (!target.isMuslim) {
    return {
      reason: 'non-muslim',
      headline: `${target.fullName} is recorded as non-Muslim.`,
      explanation: 'In Islamic inheritance law (Hanafi), a non-Muslim cannot inherit from a Muslim. The Prophet ﷺ said: "A Muslim does not inherit from a disbeliever, nor a disbeliever from a Muslim." (Bukhari & Muslim)',
      fix: 'If this is incorrect, edit the person and check the "Muslim" checkbox.',
    };
  }

  if (target.excludedFromInheritance) {
    return {
      reason: 'excluded',
      headline: `${target.fullName} has been explicitly excluded from inheritance.`,
      explanation: target.exclusionReason
        ? `Exclusion reason: "${target.exclusionReason}"`
        : 'This person was marked as excluded in the family tree settings.',
      fix: 'To restore them as an heir, edit the person and uncheck "Exclude this person from inheritance".',
    };
  }

  if (!target.isAlive) {
    return {
      reason: 'deceased',
      headline: `${target.fullName} is recorded as deceased.`,
      explanation: 'A deceased person cannot directly inherit. However, if they have living descendants, those descendants may inherit through the Representation doctrine (Pakistani law).',
      fix: 'Check if their children are in the family tree — they may inherit instead.',
    };
  }

  const label = relationship.label.toLowerCase();

  // Grandchild blocked by living parent
  if (relationship.throughParent && relationship.throughParent.isAlive) {
    return {
      reason: 'blocked-by-parent',
      headline: `${target.fullName} is blocked by their living parent.`,
      explanation: `In Hanafi inheritance, a grandchild does NOT inherit from grandparents if their own parent (${relationship.throughParent.fullName}) is still alive. The parent inherits instead, on behalf of the family line. This is the standard rule of "Hajb" (blocking).`,
      fix: `If ${relationship.throughParent.fullName} were to predecease the deceased, then ${target.fullName} would inherit through the Representation doctrine.`,
    };
  }

  // Distant relative
  if (label.includes('distant') || label.includes('no traceable')) {
    return {
      reason: 'too-distant',
      headline: `${target.fullName}'s relationship is too distant.`,
      explanation: 'Either there is no clear family connection in the tree, or this person belongs to Dhawu al-Arham (distant relatives like cousins, aunts, uncles) who only inherit when no closer heir (children, spouse, parents, siblings) exists.',
      fix: 'Check the family tree relationships. You may need to add intermediate family members to establish the connection.',
    };
  }

  // Uncle / aunt
  if (label.includes('uncle') || label.includes('aunt')) {
    return {
      reason: 'too-distant',
      headline: `${target.fullName} is an uncle/aunt and is blocked by closer heirs.`,
      explanation: 'In Hanafi inheritance, uncles and aunts only inherit when there are no closer heirs (no children, spouse, parents, or siblings). If any of those exist, uncles/aunts are blocked.',
      fix: 'Mark all closer heirs as deceased/excluded to see uncle/aunt inheritance.',
    };
  }

  // Generic fallback
  return {
    reason: 'unknown',
    headline: `${target.fullName} is not among the eligible heirs.`,
    explanation: `Their relationship to the deceased (${relationship.label}) may not have direct inheritance rights in this scenario, or they may be blocked by closer heirs.`,
    fix: 'Check the relationships in your family tree and ensure they are correctly set.',
  };
}
