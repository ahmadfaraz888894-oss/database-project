/**
 * SCHOLAR VERIFICATION — Quranic/Hadith basis for each inheritance rule
 *
 * Maps every inheritance share type to its Quranic verse, Hadith, or
 * scholarly consensus (Ijma). Builds user trust and educates them.
 *
 * Sources: Qur'an An-Nisa 4:11-12, 4:176 (main inheritance verses)
 *          Sahih al-Bukhari, Sahih Muslim (key hadiths)
 *          Hidayah, Fath al-Qadir (Hanafi authorities)
 */

export const INHERITANCE_RULES = {
  husband_no_descendants: {
    relationship: 'Husband (no descendants)',
    share: '1/2',
    source: 'Qur\'an 4:12',
    arabic: 'وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ',
    translation: '"And for you is half of what your wives leave behind, if they have no child."',
    explanation: 'When a Muslim woman dies leaving no children or grandchildren, her husband inherits half of her estate before all other heirs.',
  },
  husband_with_descendants: {
    relationship: 'Husband (with descendants)',
    share: '1/4',
    source: 'Qur\'an 4:12',
    arabic: 'فَإِن كَانَ لَهُنَّ وَلَدٌ فَلَكُمُ الرُّبُعُ مِمَّا تَرَكْنَ',
    translation: '"But if they have a child, then for you is one fourth of what they leave."',
    explanation: 'When children exist, the husband\'s share is reduced to 1/4 to ensure descendants receive their inheritance.',
  },
  wife_no_descendants: {
    relationship: 'Wife / Wives (no descendants)',
    share: '1/4',
    source: 'Qur\'an 4:12',
    arabic: 'وَلَهُنَّ الرُّبُعُ مِمَّا تَرَكْتُمْ إِن لَّمْ يَكُن لَّكُمْ وَلَدٌ',
    translation: '"And for them is one fourth of what you leave, if you have no child."',
    explanation: 'Wives collectively share 1/4 of the estate when the husband leaves no descendants.',
  },
  wife_with_descendants: {
    relationship: 'Wife / Wives (with descendants)',
    share: '1/8',
    source: 'Qur\'an 4:12',
    arabic: 'فَإِن كَانَ لَكُمْ وَلَدٌ فَلَهُنَّ الثُّمُنُ',
    translation: '"But if you leave a child, then for them is one eighth of what you leave."',
    explanation: 'When children exist, wives collectively share 1/8 (divided equally if multiple wives).',
  },
  father_with_male_descendants: {
    relationship: 'Father (with sons/grandsons)',
    share: '1/6',
    source: 'Qur\'an 4:11',
    arabic: 'وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُ وَلَدٌ',
    translation: '"And for one\'s parents, to each one of them is a sixth of what he left, if he had a child."',
    explanation: 'Father gets 1/6 as fixed share when there is a son or agnatic grandson present.',
  },
  father_no_descendants: {
    relationship: 'Father (no descendants)',
    share: 'Residue (Asaba)',
    source: 'Qur\'an 4:11 + Hadith',
    arabic: 'فَإِن لَّمْ يَكُن لَّهُ وَلَدٌ وَوَرِثَهُ أَبَوَاهُ فَلِأُمِّهِ الثُّلُثُ',
    translation: '"And if he has no child and the parents inherit, then for his mother is one third [and the rest to the father]."',
    explanation: 'When there are no descendants, mother takes 1/3 and the entire remainder goes to the father as Asaba (residuary).',
  },
  mother_with_descendants: {
    relationship: 'Mother (with descendants/siblings)',
    share: '1/6',
    source: 'Qur\'an 4:11',
    arabic: 'فَإِن كَانَ لَهُ إِخْوَةٌ فَلِأُمِّهِ السُّدُسُ',
    translation: '"And if he had brothers/sisters, then for the mother is one sixth."',
    explanation: 'Mother\'s share is reduced to 1/6 when there are children OR two or more siblings of the deceased.',
  },
  mother_no_descendants: {
    relationship: 'Mother (no descendants, ≤1 sibling)',
    share: '1/3',
    source: 'Qur\'an 4:11',
    arabic: 'فَإِن لَّمْ يَكُن لَّهُ وَلَدٌ وَوَرِثَهُ أَبَوَاهُ فَلِأُمِّهِ الثُّلُثُ',
    translation: '"...and if he has no child and his parents inherit, then for his mother is one third."',
    explanation: 'Mother gets the full 1/3 share when there are no children/grandchildren and fewer than 2 siblings.',
  },
  umariyyatan: {
    relationship: 'Mother (Umariyyatan special case)',
    share: '1/3 of remainder',
    source: 'Hadith - Ruling of Umar (RA), agreed upon by Companions',
    arabic: 'قضاء عمر بن الخطاب رضي الله عنه',
    translation: 'The ruling of \'Umar ibn al-Khattab (may Allah be pleased with him)',
    explanation: 'When heirs are only spouse + mother + father, mother takes 1/3 of what remains AFTER the spouse\'s share (not 1/3 of total). This preserves the 2:1 ratio between father and mother. This ruling of \'Umar (RA) was unanimously accepted by all schools.',
  },
  daughter_alone: {
    relationship: 'Daughter (alone)',
    share: '1/2',
    source: 'Qur\'an 4:11',
    arabic: 'وَإِن كَانَتْ وَاحِدَةً فَلَهَا النِّصْفُ',
    translation: '"And if there is only one [daughter], for her is half."',
    explanation: 'A single daughter (with no sons) receives 1/2 of the estate.',
  },
  daughters_multiple: {
    relationship: 'Daughters (2 or more)',
    share: '2/3 collectively',
    source: 'Qur\'an 4:11',
    arabic: 'فَإِن كُنَّ نِسَاءً فَوْقَ اثْنَتَيْنِ فَلَهُنَّ ثُلُثَا مَا تَرَكَ',
    translation: '"If there are [only] daughters, two or more, for them is two thirds of one\'s estate."',
    explanation: 'Two or more daughters (with no sons) share 2/3 equally.',
  },
  daughter_with_son: {
    relationship: 'Daughter (with brothers)',
    share: '1 share (vs. 2 per son)',
    source: 'Qur\'an 4:11',
    arabic: 'يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ',
    translation: '"Allah instructs you concerning your children: for the male, what is equal to the share of two females."',
    explanation: 'When sons and daughters inherit together, they are residuaries. The 2:1 ratio (son : daughter) reflects that men bear financial responsibility (mahr, nafaqah) while women keep their inheritance separately.',
  },
  son: {
    relationship: 'Son',
    share: 'Residue (2 shares each)',
    source: 'Qur\'an 4:11',
    arabic: 'لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ',
    translation: '"For the male, what is equal to the share of two females."',
    explanation: 'Sons are Asaba (residuary heirs) — they take whatever remains after fixed shares. Each son receives twice what each daughter receives.',
  },
  uterine_sibling: {
    relationship: 'Uterine sibling',
    share: '1/6 (one) or 1/3 (multiple, equal)',
    source: 'Qur\'an 4:12',
    arabic: 'وَإِن كَانَ رَجُلٌ يُورَثُ كَلَالَةً ... وَلَهُ أَخٌ أَوْ أُخْتٌ فَلِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ',
    translation: '"If a man or woman leaves neither ascendants nor descendants but has a brother or sister, each of the two gets a sixth..."',
    explanation: 'Half-siblings from the same mother. One gets 1/6; two or more share 1/3 EQUALLY (no gender distinction — unique among heirs). Blocked by descendants, father, or paternal grandfather.',
  },
  full_sister_alone: {
    relationship: 'Full sister (alone, no descendants)',
    share: '1/2',
    source: 'Qur\'an 4:176',
    arabic: 'إِنِ امْرُؤٌ هَلَكَ لَيْسَ لَهُ وَلَدٌ وَلَهُ أُخْتٌ فَلَهَا نِصْفُ مَا تَرَكَ',
    translation: '"If a man dies childless and leaves a sister, she gets half of his estate."',
    explanation: 'A single full sister (no descendants, no father) inherits 1/2.',
  },
  full_sisters_multiple: {
    relationship: 'Full sisters (2+)',
    share: '2/3 collectively',
    source: 'Qur\'an 4:176',
    arabic: 'فَإِن كَانَتَا اثْنَتَيْنِ فَلَهُمَا الثُّلُثَانِ مِمَّا تَرَكَ',
    translation: '"If there are two [or more] sisters, they collectively get two-thirds of his estate."',
    explanation: 'Two or more full sisters share 2/3 of the estate equally.',
  },
  awl: {
    relationship: 'Awl (proportional reduction)',
    share: 'All fixed shares reduced',
    source: 'Hadith + Ijma (consensus)',
    arabic: 'العول في الفرائض',
    translation: 'Doctrine of Awl in inheritance',
    explanation: 'When fixed Quranic shares add up to MORE than 1 (impossible mathematically), all shares are reduced proportionally to fit. First established by Caliph \'Umar (RA) in the famous "Minbariyyah" case. Universal consensus among all Sunni schools.',
  },
  radd: {
    relationship: 'Radd (proportional return)',
    share: 'Remainder returned to heirs',
    source: 'Hanafi position, supported by some Companions',
    arabic: 'الرد في الفرائض',
    translation: 'Doctrine of Radd in inheritance',
    explanation: 'When fixed shares add up to LESS than 1 and there are no male agnates (Asaba) to take the residue, the remainder returns proportionally to existing heirs. Spouses are EXCLUDED from Radd in the Hanafi school.',
  },
  representation: {
    relationship: 'Representation Doctrine (Modern)',
    share: 'Predeceased heir\'s share to descendants',
    source: 'Pakistan Muslim Family Laws Ordinance 1961, Section 4',
    arabic: 'قانون الأحوال الشخصية المسلمين الباكستاني',
    translation: 'Pakistani Muslim Family Law (1961)',
    explanation: 'A modern Pakistani legal reform: if a child predeceases the parent, that child\'s share automatically passes to their own descendants (orphaned grandchildren). This corrected an injustice in classical Faraid where orphaned grandchildren received nothing. Not accepted by all classical scholars but legally enforceable in Pakistan.',
  },
  bequest_limit: {
    relationship: 'Wasiyyah Limit',
    share: 'Maximum 1/3 of net estate',
    source: 'Hadith - Sahih al-Bukhari & Muslim',
    arabic: 'الثُّلُثُ، وَالثُّلُثُ كَثِيرٌ',
    translation: '"One-third, and one-third is a lot."',
    explanation: 'Sa\'d ibn Abi Waqqas (RA) asked the Prophet ﷺ if he could bequeath his entire wealth. The Prophet ﷺ said no, then progressively: not half, not even one-third — "one-third, and one-third is a lot." A Muslim cannot bequeath more than 1/3 of their estate to non-heirs.',
  },
};

/**
 * Match a share's relationship/category to a rule key for verification display.
 */
export function findRule(share, context = {}) {
  const { hasDescendants, hasSiblings } = context;
  const rel = (share.relationship || '').toLowerCase();
  const reason = (share.reason || '').toLowerCase();

  if (rel === 'husband') return hasDescendants ? INHERITANCE_RULES.husband_with_descendants : INHERITANCE_RULES.husband_no_descendants;
  if (rel === 'wife') return hasDescendants ? INHERITANCE_RULES.wife_with_descendants : INHERITANCE_RULES.wife_no_descendants;
  if (rel === 'father') {
    if (reason.includes('male descendant')) return INHERITANCE_RULES.father_with_male_descendants;
    return INHERITANCE_RULES.father_no_descendants;
  }
  if (rel === 'mother') {
    if (reason.includes('umariyyatan')) return INHERITANCE_RULES.umariyyatan;
    if (reason.includes('descendant') || reason.includes('sibling')) return INHERITANCE_RULES.mother_with_descendants;
    return INHERITANCE_RULES.mother_no_descendants;
  }
  if (rel === 'son') return INHERITANCE_RULES.son;
  if (rel === 'daughter') {
    if (reason.includes('alone')) return INHERITANCE_RULES.daughter_alone;
    if (reason.includes('2/3') || reason.includes('share')) return INHERITANCE_RULES.daughters_multiple;
    return INHERITANCE_RULES.daughter_with_son;
  }
  if (rel.includes('uterine')) return INHERITANCE_RULES.uterine_sibling;
  if (rel.includes('full sister')) {
    if (reason.includes('alone')) return INHERITANCE_RULES.full_sister_alone;
    return INHERITANCE_RULES.full_sisters_multiple;
  }
  return null;
}
