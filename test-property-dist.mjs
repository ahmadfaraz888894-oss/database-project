// Test per-property distribution
import { calculateCascadingInheritance } from './src/lib/inheritance/cascading.js';
import { distributeProperties, formatAllocation } from './src/lib/inheritance/propertyDistribution.js';

function makePerson(id, name, gender, isAlive, fatherId = null) {
  return { id, fullName: name, gender, isAlive, fatherId, isMuslim: true };
}

console.log('═══ PROPERTY DISTRIBUTION TEST ═══');
console.log('Grandfather dies leaving:');
console.log('  • 10 Kanal of land in Lahore worth ₨5,000,000');
console.log('  • 50 Tola of gold worth ₨2,000,000');
console.log('  • ₨3,000,000 cash');
console.log('Total estate: ₨10,000,000');
console.log('Heirs: Wife + 3 Sons + 2 Daughters\n');

const gp = makePerson('gp', 'Grandfather', 'male', false);
const gpw = makePerson('gpw', 'Grandmother', 'female', true);
const s1 = makePerson('s1', 'Son 1', 'male', true, 'gp');
const s2 = makePerson('s2', 'Son 2', 'male', true, 'gp');
const s3 = makePerson('s3', 'Son 3', 'male', true, 'gp');
const d1 = makePerson('d1', 'Daughter 1', 'female', true, 'gp');
const d2 = makePerson('d2', 'Daughter 2', 'female', true, 'gp');

const persons = [gp, gpw, s1, s2, s3, d1, d2];
const spouses = [{ id: 'sp', personId: 'gp', spouseId: 'gpw', isActive: true }];

const properties = [
  { id: 'p1', name: 'Land in DHA Lahore', type: 'land', value: 5000000,
    areaValue: 10, areaUnit: 'kanal', subtype: 'Residential' },
  { id: 'p2', name: '22K Wedding Gold Set', type: 'gold', value: 2000000,
    weightValue: 50, weightUnit: 'tola', subtype: '22 Karat' },
  { id: 'p3', name: 'HBL Savings', type: 'cash', value: 3000000, subtype: 'Savings Account' },
];

const result = calculateCascadingInheritance(gp, persons, spouses, 10000000);
const propDist = distributeProperties(properties, result.shares);

for (const pb of propDist) {
  console.log(`\n📦 ${pb.property.name}`);
  console.log(`   Total: ${pb.property.totalArea ? pb.property.totalArea.value + ' ' + pb.property.totalArea.unit : ''}${pb.property.totalWeight ? pb.property.totalWeight.value + ' ' + pb.property.totalWeight.unit : ''} worth ₨${pb.property.value.toLocaleString()}`);
  for (const a of pb.allocations) {
    console.log(`   • ${a.heirName} (${a.relationship}): ${formatAllocation(a)}`);
  }
}
