import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await prisma.family.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      persons: true,
      properties: { include: { owner: true } },
    },
  });
  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Calculate generation levels (BFS from roots)
  const personMap = new Map(family.persons.map(p => [p.id, p]));
  const levels = new Map();
  const roots = family.persons.filter(
    p => (!p.fatherId || !personMap.has(p.fatherId)) && (!p.motherId || !personMap.has(p.motherId))
  );
  for (const r of roots) levels.set(r.id, 0);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of family.persons) {
      const parentLvls = [];
      if (p.fatherId && levels.has(p.fatherId)) parentLvls.push(levels.get(p.fatherId));
      if (p.motherId && levels.has(p.motherId)) parentLvls.push(levels.get(p.motherId));
      if (parentLvls.length > 0) {
        const nl = Math.max(...parentLvls) + 1;
        if (!levels.has(p.id) || levels.get(p.id) !== nl) {
          levels.set(p.id, nl);
          changed = true;
        }
      }
    }
  }
  for (const p of family.persons) if (!levels.has(p.id)) levels.set(p.id, 0);

  // Aggregate stats
  const totalWealth = family.properties.reduce((s, p) => s + p.value, 0);
  const totalDebts = family.properties.reduce((s, p) => s + p.debts, 0);
  const livingCount = family.persons.filter(p => p.isAlive).length;
  const deceasedCount = family.persons.length - livingCount;
  const maleCount = family.persons.filter(p => p.gender === 'male').length;
  const femaleCount = family.persons.filter(p => p.gender === 'female').length;

  // Properties by type
  const propsByType = {};
  for (const p of family.properties) {
    if (!propsByType[p.type]) propsByType[p.type] = { count: 0, value: 0 };
    propsByType[p.type].count++;
    propsByType[p.type].value += p.value;
  }

  // Generation breakdown
  const generations = {};
  for (const p of family.persons) {
    const lvl = levels.get(p.id);
    if (!generations[lvl]) generations[lvl] = { count: 0, living: 0, deceased: 0 };
    generations[lvl].count++;
    if (p.isAlive) generations[lvl].living++;
    else generations[lvl].deceased++;
  }
  const generationArray = Object.entries(generations)
    .map(([level, data]) => ({ level: parseInt(level), ...data }))
    .sort((a, b) => a.level - b.level);

  // Per-person property holdings
  const wealthByPerson = family.persons.map(p => ({
    id: p.id,
    name: p.fullName,
    isAlive: p.isAlive,
    propertyCount: family.properties.filter(pr => pr.ownerId === p.id).length,
    wealth: family.properties.filter(pr => pr.ownerId === p.id).reduce((s, pr) => s + pr.value, 0),
  })).sort((a, b) => b.wealth - a.wealth);

  return NextResponse.json({
    summary: {
      totalPersons: family.persons.length,
      livingCount,
      deceasedCount,
      maleCount,
      femaleCount,
      totalProperties: family.properties.length,
      totalWealth,
      totalDebts,
      netWealth: totalWealth - totalDebts,
      avgWealthPerPerson: family.persons.length > 0 ? totalWealth / family.persons.length : 0,
    },
    propsByType,
    generationArray,
    wealthByPerson,
  });
}
