// Test cascading inheritance through 3 generations
import { calculateCascadingInheritance } from './src/lib/inheritance/cascading.js';

function makePerson(id, name, gender, isAlive, fatherId = null, motherId = null) {
  return { id, fullName: name, gender, isAlive, fatherId, motherId, isMuslim: true };
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('CASCADING TEST: Grandfather dies with ₨10M');
console.log('  Wife (living)');
console.log('  Son Ahmed (DECEASED) — has wife + son + daughter');
console.log('  Son Bilal (living)');
console.log('  Daughter Ayesha (living)');
console.log('');
console.log('Expected:');
console.log('  Wife → 1/8 = ₨1,250,000  (gets directly)');
console.log('  Bilal → keeps his Son share');
console.log('  Ayesha → keeps her Daughter share');
console.log('  Ahmed dead → his Son share cascades to:');
console.log('    Ahmed\'s wife = 1/8 of his share');
console.log('    Ahmed\'s son/daughter share 7/8 (2:1)');
console.log('═══════════════════════════════════════════════════════════════');

// Grandfather (deceased - originally dying)
const gp = makePerson('gp', 'Grandfather Khan', 'male', false);
const gpwife = makePerson('gpw', 'Grandmother Khan', 'female', true);

// Children of grandfather
const ahmed = makePerson('ahmed', 'Son Ahmed (deceased)', 'male', false, 'gp', 'gpw');
const bilal = makePerson('bilal', 'Son Bilal', 'male', true, 'gp', 'gpw');
const ayesha = makePerson('ayesha', 'Daughter Ayesha', 'female', true, 'gp', 'gpw');

// Ahmed's wife and children (grandchildren of gp)
const ahmedwife = makePerson('aw', 'Ahmed\'s Wife Sara', 'female', true);
const ahmedson = makePerson('as', 'Ahmed\'s Son Hasan', 'male', true, 'ahmed', 'aw');
const ahmeddau = makePerson('ad', 'Ahmed\'s Daughter Hina', 'female', true, 'ahmed', 'aw');

const persons = [gp, gpwife, ahmed, bilal, ayesha, ahmedwife, ahmedson, ahmeddau];
const spouses = [
  { id: 's1', personId: 'gp', spouseId: 'gpw', isActive: true },
  { id: 's2', personId: 'ahmed', spouseId: 'aw', isActive: true },
];

const result = calculateCascadingInheritance(gp, persons, spouses, 10000000);

console.log('\n── Direct shares (before cascade) ──');
for (const s of result.rawShares) {
  console.log(`  ${s.name}: ${s.fraction} = ₨${Math.round(s.amount).toLocaleString()}`);
}

console.log('\n── Cascade chain (the flow) ──');
for (const c of result.cascadeChain) {
  const indent = '  '.repeat(c.level + 1);
  const arrow = c.cascaded ? '↪' : '→';
  console.log(`${indent}${arrow} ${c.to} (${c.relationship}): ₨${Math.round(c.amount).toLocaleString()}${c.isDeceased ? ' [DECEASED — cascading]' : ''}`);
}

console.log('\n── FINAL DISTRIBUTION (to living people only) ──');
let total = 0;
for (const s of result.shares) {
  console.log(`  ${s.name} (${s.relationship}): ₨${Math.round(s.amount).toLocaleString()}`);
  if (s.cascadedFrom) console.log(`    ↳ via: ${s.cascadedFrom}`);
  total += s.amount;
}
console.log(`\n  TOTAL DISTRIBUTED: ₨${Math.round(total).toLocaleString()}`);
console.log(`  Should equal:     ₨10,000,000`);
console.log(`  ✓ Match: ${Math.abs(total - 10000000) < 1 ? 'YES' : 'NO'}`);
