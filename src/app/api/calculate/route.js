import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateMultiGenerationProjection } from '@/lib/inheritance/cascading';
import { distributeProperties } from '@/lib/inheritance/propertyDistribution';
import { findRule } from '@/lib/inheritanceRules';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { deceasedId, customEstate, mode, simulateDeath } = await request.json();
  if (!deceasedId) return NextResponse.json({ error: 'Deceased person required' }, { status: 400 });

  const deceased = await prisma.person.findUnique({
    where: { id: deceasedId },
    include: { family: true, properties: true },
  });
  if (!deceased || deceased.family.userId !== user.id) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 });
  }

  if (!deceased.isAlive && simulateDeath) {
    return NextResponse.json({ error: 'Person is already deceased' }, { status: 400 });
  }
  if (deceased.isAlive && !simulateDeath) {
    return NextResponse.json({ error: 'Person is still alive (use simulation mode)' }, { status: 400 });
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

  const workingPersons = simulateDeath
    ? allPersons.map(p => p.id === deceased.id ? { ...p, isAlive: false } : p)
    : allPersons;
  const workingDeceased = simulateDeath ? { ...deceased, isAlive: false } : deceased;

  let totalEstate = 0, totalDebts = 0, totalFuneral = 0, totalBequest = 0;
  if (customEstate) {
    totalEstate = parseFloat(customEstate.totalEstate) || 0;
    totalDebts = parseFloat(customEstate.debts) || 0;
    totalFuneral = parseFloat(customEstate.funeralCost) || 0;
    totalBequest = parseFloat(customEstate.bequest) || 0;
  } else {
    for (const prop of deceased.properties) {
      totalEstate += prop.value;
      totalDebts += prop.debts;
      totalFuneral += prop.funeralCost;
      totalBequest += prop.bequest;
    }
  }

  // Use multi-generation projection (includes regular cascade + sub-projections)
  const result = calculateMultiGenerationProjection(
    workingDeceased,
    workingPersons,
    allSpouses,
    totalEstate,
    { funeralCost: totalFuneral, debts: totalDebts, bequest: totalBequest },
    { mode: mode || 'representation' }
  );

  // Per-property distribution
  result.propertyDistribution = distributeProperties(deceased.properties, result.shares || []);
  result.properties = deceased.properties.map(p => ({
    id: p.id, name: p.name, type: p.type, value: p.value, location: p.location,
  }));

  // For each branch's sub-distribution, ALSO compute property breakdown
  if (result.multiGeneration && result.multiGeneration.branches) {
    for (const branch of result.multiGeneration.branches) {
      if (branch.subDistribution) {
        // Build a "sub-properties" list scaled to the branch's amount
        const branchFraction = branch.fractionDecimal || 0;
        const scaledProperties = deceased.properties.map(p => ({
          ...p,
          value: p.value * branchFraction,
          areaValue: p.areaValue ? p.areaValue * branchFraction : null,
          weightValue: p.weightValue ? p.weightValue * branchFraction : null,
          quantity: p.quantity ? p.quantity * branchFraction : null,
        }));
        branch.subDistribution.propertyDistribution = distributeProperties(
          scaledProperties,
          branch.subDistribution.branches.map(sb => ({
            personId: sb.heirId,
            name: sb.heirName,
            relationship: sb.relationship,
            fractionDecimal: sb.fractionDecimal,
            percentage: sb.percentage,
          }))
        );
      }
    }
  }

  // Scholar verification
  const hasDescendants = allPersons.some(p =>
    (p.fatherId === workingDeceased.id || p.motherId === workingDeceased.id) && p.isAlive && p.isMuslim
  );
  if (result.shares) {
    result.shares = result.shares.map(s => {
      const rule = findRule(s, { hasDescendants });
      return { ...s, scholarVerification: rule };
    });
  }

  // Wasiyyah validator
  const netAfterDebtsFuneral = totalEstate - totalDebts - totalFuneral;
  const maxBequest = netAfterDebtsFuneral / 3;
  result.wasiyyahValidation = {
    requestedBequest: totalBequest,
    maxAllowed: maxBequest,
    isValid: totalBequest <= maxBequest,
    excess: totalBequest > maxBequest ? totalBequest - maxBequest : 0,
    percentOfEstate: netAfterDebtsFuneral > 0 ? (totalBequest / netAfterDebtsFuneral * 100) : 0,
  };

  result.isSimulation = !!simulateDeath;
  result.deceasedPersonName = deceased.fullName;

  return NextResponse.json(result);
}
