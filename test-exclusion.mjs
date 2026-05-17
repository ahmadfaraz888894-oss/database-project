import { calculateCascadingInheritance } from './src/lib/inheritance/cascading.js';

function p(id, name, gender, isAlive, fatherId = null, motherId = null, excluded = false) {
  return { id, fullName: name, gender, isAlive, fatherId, motherId, isMuslim: true, excludedFromInheritance: excluded };
}

console.log('═══ EXCLUSION TEST ═══\n');
console.log('Grandfather dies with ₨10M');
console.log('Heirs: Wife + 3 Sons + 1 Daughter');
console.log('But Son 2 is EXCLUDED (court order)\n');

const gp = p('gp', 'Grandfather', 'male', false);
const gpw = p('gpw', 'Grandmother', 'female', true);
const s1 = p('s1', 'Son 1', 'male', true, 'gp', 'gpw');
const s2 = p('s2', 'Son 2 (EXCLUDED)', 'male', true, 'gp', 'gpw', true); // EXCLUDED
const s3 = p('s3', 'Son 3', 'male', true, 'gp', 'gpw');
const d1 = p('d1', 'Daughter', 'female', true, 'gp', 'gpw');

const result = calculateCascadingInheritance(
  gp,
  [gp, gpw, s1, s2, s3, d1],
  [{ id: 'sp', personId: 'gp', spouseId: 'gpw', isActive: true }],
  10000000
);

console.log('Distribution:');
for (const s of result.shares) {
  console.log(`  ${s.name} (${s.relationship}): ${parseFloat(s.percentage).toFixed(2)}% = ₨${Math.round(s.amount).toLocaleString()}`);
}

console.log('\n✓ Son 2 should NOT appear above (excluded).');
console.log('✓ Total should still be 10M, redistributed to remaining heirs.');

const total = result.shares.reduce((sum, s) => sum + s.amount, 0);
console.log(`\nTotal distributed: ₨${Math.round(total).toLocaleString()}`);
console.log(`Match 10M: ${Math.abs(total - 10000000) < 1 ? '✓' : '✗'}`);
console.log(`Son 2 excluded: ${result.shares.find(s => s.personId === 's2') ? '✗ (BUG - still showed)' : '✓'}`);
