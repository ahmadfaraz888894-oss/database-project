import { calculateMultiGenerationProjection } from './src/lib/inheritance/cascading.js';

function p(id, name, gender, isAlive, fatherId = null, motherId = null) {
  return { id, fullName: name, gender, isAlive, fatherId, motherId, isMuslim: true };
}

console.log('═══ MULTI-GENERATION PROJECTION TEST ═══');
console.log('Grandfather dies, leaves: Wife + 3 Sons + 1 Daughter');
console.log('Each son has his own wife + 2 children');
console.log('Estate: ₨10,000,000\n');

const gp = p('gp', 'Grandfather', 'male', false);
const gpw = p('gpw', 'Grandmother', 'female', true);
const s1 = p('s1', 'Son 1 (Ahmed)', 'male', true, 'gp', 'gpw');
const s2 = p('s2', 'Son 2 (Bilal)', 'male', true, 'gp', 'gpw');
const s3 = p('s3', 'Son 3 (Tariq)', 'male', true, 'gp', 'gpw');
const d1 = p('d1', 'Daughter (Ayesha)', 'female', true, 'gp', 'gpw');

const s1w = p('s1w', 'Ahmed\'s Wife', 'female', true);
const s1c1 = p('s1c1', 'Ahmed\'s Son', 'male', true, 's1', 's1w');
const s1c2 = p('s1c2', 'Ahmed\'s Daughter', 'female', true, 's1', 's1w');

const s2w = p('s2w', 'Bilal\'s Wife', 'female', true);
const s2c1 = p('s2c1', 'Bilal\'s Son', 'male', true, 's2', 's2w');
const s2c2 = p('s2c2', 'Bilal\'s Daughter', 'female', true, 's2', 's2w');

const s3w = p('s3w', 'Tariq\'s Wife', 'female', true);
const s3c1 = p('s3c1', 'Tariq\'s Son', 'male', true, 's3', 's3w');

const persons = [gp, gpw, s1, s2, s3, d1, s1w, s1c1, s1c2, s2w, s2c1, s2c2, s3w, s3c1];
const spouses = [
  { id: 'sp0', personId: 'gp', spouseId: 'gpw', isActive: true },
  { id: 'sp1', personId: 's1', spouseId: 's1w', isActive: true },
  { id: 'sp2', personId: 's2', spouseId: 's2w', isActive: true },
  { id: 'sp3', personId: 's3', spouseId: 's3w', isActive: true },
];

const result = calculateMultiGenerationProjection(gp, persons, spouses, 10000000);

console.log('═══ LEVEL 0: Direct heirs of Grandfather ═══');
for (const b of result.multiGeneration.branches) {
  console.log(`\n📌 ${b.heirName} (${b.relationship}): ${b.percentage}% = ₨${Math.round(b.amount).toLocaleString()}`);

  if (b.subDistribution) {
    console.log(`   ↳ ${b.subDistribution.note}`);
    for (const sb of b.subDistribution.branches) {
      console.log(`      • ${sb.heirName} (${sb.relationship}): ₨${Math.round(sb.amount).toLocaleString()}`);
      if (sb.subDistribution) {
        for (const ssb of sb.subDistribution.branches) {
          console.log(`         ↳ ${ssb.heirName}: ₨${Math.round(ssb.amount).toLocaleString()}`);
        }
      }
    }
  }
}
