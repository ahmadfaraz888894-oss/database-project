/**
 * Personal share lookup: For each LIVING person in the family,
 * shows how much they would inherit if the selected person dies.
 * Used by the "Who gets what?" search feature.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateCascadingInheritance } from '@/lib/inheritance/cascading';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { deceasedId, lookupPersonId, simulateDeath } = await request.json();
  if (!deceasedId || !lookupPersonId) {
    return NextResponse.json({ error: 'Both deceasedId and lookupPersonId required' }, { status: 400 });
  }

  const deceased = await prisma.person.findUnique({
    where: { id: deceasedId },
    include: { family: true, properties: true },
  });
  if (!deceased || deceased.family.userId !== user.id) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 });
  }

  const lookupPerson = await prisma.person.findUnique({
    where: { id: lookupPersonId },
  });
  if (!lookupPerson || lookupPerson.familyId !== deceased.familyId) {
    return NextResponse.json({ error: 'Lookup person not in same family' }, { status: 400 });
  }

  const allPersons = await prisma.person.findMany({ where: { familyId: deceased.familyId } });
  const allSpouses = await prisma.spouse.findMany({
    where: {
      OR: [
        { person: { familyId: deceased.familyId } },
        { spouse: { familyId: deceased.familyId } },
      ],
    },
  });

  // Handle simulation if deceased is still alive
  const workingPersons = simulateDeath
    ? allPersons.map(p => p.id === deceased.id ? { ...p, isAlive: false } : p)
    : allPersons;
  const workingDeceased = simulateDeath ? { ...deceased, isAlive: false } : deceased;

  const totalEstate = deceased.properties.reduce((s, p) => s + p.value, 0);
  const totalDebts = deceased.properties.reduce((s, p) => s + p.debts, 0);
  const totalFuneral = deceased.properties.reduce((s, p) => s + p.funeralCost, 0);
  const totalBequest = deceased.properties.reduce((s, p) => s + p.bequest, 0);

  const result = calculateCascadingInheritance(
    workingDeceased,
    workingPersons,
    allSpouses,
    totalEstate,
    { funeralCost: totalFuneral, debts: totalDebts, bequest: totalBequest },
    { mode: 'representation' }
  );

  // Find this specific person's share(s)
  const myShares = (result.shares || []).filter(s => s.personId === lookupPersonId);
  const totalMyAmount = myShares.reduce((sum, s) => sum + s.amount, 0);
  const totalMyFraction = myShares.reduce((sum, s) => sum + (s.fractionDecimal || 0), 0);

  return NextResponse.json({
    deceasedName: deceased.fullName,
    deceasedIsSimulated: !!simulateDeath,
    lookupPerson: {
      id: lookupPerson.id,
      name: lookupPerson.fullName,
      gender: lookupPerson.gender,
      isAlive: lookupPerson.isAlive,
    },
    totalEstate,
    netEstate: result.netEstate,
    myShares,
    totalAmount: totalMyAmount,
    totalFraction: totalMyFraction,
    totalPercentage: (totalMyFraction * 100).toFixed(4),
    inheritsFrom: myShares.length > 0,
  });
}
