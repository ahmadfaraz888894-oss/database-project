// Test cases verifying classical Hanafi Faraid scenarios
import { calculateInheritance } from './src/lib/inheritance/calculator.js';

function makePerson(id, name, gender, isAlive, fatherId = null, motherId = null) {
  return { id, fullName: name, gender, isAlive, fatherId, motherId, isMuslim: true };
}

console.log('═══════════════════════════════════════════════════════');
console.log('TEST 1: Simple - Wife + 2 Sons + 1 Daughter (1,000,000 PKR)');
console.log('Expected: Wife 1/8 = 125,000');
console.log('          Each son = (7/8) × (2/5) = 175,000');
console.log('          Daughter = (7/8) × (1/5) = 175,000');
console.log('          2 sons share 350,000 → 175,000 each');
console.log('═══════════════════════════════════════════════════════');

const deceased1 = makePerson('d1', 'Ahmed (deceased)', 'male', false);
const wife1 = makePerson('w1', 'Fatima', 'female', true);
const son1 = makePerson('s1', 'Ali', 'male', true, 'd1');
const son2 = makePerson('s2', 'Hassan', 'male', true, 'd1');
const dau1 = makePerson('da1', 'Aisha', 'female', true, 'd1');

const persons1 = [deceased1, wife1, son1, son2, dau1];
const spouses1 = [{ id: 'sp1', personId: 'd1', spouseId: 'w1', isActive: true }];

const result1 = calculateInheritance(deceased1, persons1, spouses1, 1000000);
console.log('Net Estate:', result1.netEstate);
for (const s of result1.shares) {
  console.log(`  ${s.name} (${s.relationship}): ${s.fraction} = ${s.amount.toFixed(2)} PKR`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 2: Awl Case - Husband + 2 Full Sisters + Mother');
console.log('Expected: Husband 1/2 (3/6) + 2 Sisters 2/3 (4/6) + Mother 1/6');
console.log('          Sum = 8/6 → Awl applied');
console.log('          Husband 3/8, Sisters 4/8 (2/8 each), Mother 1/8');
console.log('═══════════════════════════════════════════════════════');

const deceased2 = makePerson('d2', 'Khadija (deceased)', 'female', false, 'f2', 'm2');
const husb2 = makePerson('h2', 'Umar', 'male', true);
const mother2 = makePerson('m2', 'Maryam', 'female', true);
const father2 = makePerson('f2', 'Yusuf', 'male', false); // Father deceased to allow uterine/full siblings
const sis1 = makePerson('s1', 'Layla', 'female', true, 'f2', 'm2');
const sis2 = makePerson('s2', 'Zaynab', 'female', true, 'f2', 'm2');

const persons2 = [deceased2, husb2, mother2, father2, sis1, sis2];
const spouses2 = [{ id: 'sp2', personId: 'd2', spouseId: 'h2', isActive: true }];

const result2 = calculateInheritance(deceased2, persons2, spouses2, 240000);
console.log('Net Estate:', result2.netEstate);
console.log('Awl applied:', result2.awlApplied, 'Factor:', result2.awlFactor);
for (const s of result2.shares) {
  console.log(`  ${s.name} (${s.relationship}): ${s.fraction} = ${s.amount.toFixed(2)} PKR`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 3: Radd Case - Mother + 1 Daughter (no other heirs)');
console.log('Expected: Daughter 1/2 + Mother 1/6 = 4/6 → Radd to 1');
console.log('          Daughter 3/4, Mother 1/4');
console.log('═══════════════════════════════════════════════════════');

const deceased3 = makePerson('d3', 'Hamza (deceased)', 'male', false);
const mother3 = makePerson('m3', 'Saira', 'female', true);
const dau3 = makePerson('da3', 'Hina', 'female', true, 'd3');

const persons3 = [deceased3, mother3, dau3];
const spouses3 = [];

const result3 = calculateInheritance(deceased3, persons3, spouses3, 120000);
console.log('Net Estate:', result3.netEstate);
console.log('Radd applied:', result3.raddApplied);
for (const s of result3.shares) {
  console.log(`  ${s.name} (${s.relationship}): ${s.fraction} = ${s.amount.toFixed(2)} PKR`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 4: Umariyyatan - Husband + Mother + Father');
console.log('Expected: Husband 1/2, Mother 1/3 of remainder (=1/6), Father residue (=2/6)');
console.log('═══════════════════════════════════════════════════════');

const deceased4 = makePerson('d4', 'Sara (deceased)', 'female', false, 'f4', 'm4');
const husb4 = makePerson('h4', 'Ibrahim', 'male', true);
const mother4 = makePerson('m4', 'Halima', 'female', true);
const father4 = makePerson('f4', 'Bilal', 'male', true);

const persons4 = [deceased4, husb4, mother4, father4];
const spouses4 = [{ id: 'sp4', personId: 'd4', spouseId: 'h4', isActive: true }];

const result4 = calculateInheritance(deceased4, persons4, spouses4, 600000);
console.log('Net Estate:', result4.netEstate);
for (const s of result4.shares) {
  console.log(`  ${s.name} (${s.relationship}): ${s.fraction} = ${s.amount.toFixed(2)} PKR`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('TEST 5: Pakistani common case - Grandfather scenario');
console.log('Grandfather dies, leaves: Wife, 3 Sons, 2 Daughters');
console.log('Expected: Wife 1/8, then 7/8 split among 3 sons (2x) + 2 daughters (1x)');
console.log('  Total weight = 6+2 = 8 shares of 7/8');
console.log('  Each son: 7/8 × 2/8 = 14/64 = 21.875%');
console.log('  Each daughter: 7/8 × 1/8 = 7/64 = 10.9375%');
console.log('═══════════════════════════════════════════════════════');

const gp = makePerson('gp', 'Grandfather Khan (deceased)', 'male', false);
const gpwife = makePerson('gpw', 'Grandmother Khan', 'female', true);
const gpson1 = makePerson('gps1', 'Son Ahmed', 'male', true, 'gp');
const gpson2 = makePerson('gps2', 'Son Bilal', 'male', true, 'gp');
const gpson3 = makePerson('gps3', 'Son Tariq', 'male', true, 'gp');
const gpdau1 = makePerson('gpd1', 'Daughter Ayesha', 'female', true, 'gp');
const gpdau2 = makePerson('gpd2', 'Daughter Fatima', 'female', true, 'gp');

const persons5 = [gp, gpwife, gpson1, gpson2, gpson3, gpdau1, gpdau2];
const spouses5 = [{ id: 'sp5', personId: 'gp', spouseId: 'gpw', isActive: true }];

const result5 = calculateInheritance(gp, persons5, spouses5, 10000000); // 1 crore
console.log('Net Estate (PKR):', result5.netEstate.toLocaleString());
for (const s of result5.shares) {
  console.log(`  ${s.name} (${s.relationship}): ${s.fraction} (${s.percentage}%) = ${s.amount.toLocaleString('en-US', {maximumFractionDigits: 0})} PKR`);
}
