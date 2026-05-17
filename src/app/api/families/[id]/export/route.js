import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await prisma.family.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      persons: { include: { spouses: true, spousesOf: true } },
      properties: true,
      documents: true,
    },
  });
  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const exportData = {
    mirathVersion: '3.0',
    exportedAt: new Date().toISOString(),
    family: { name: family.name, description: family.description },
    persons: family.persons.map(p => ({
      id: p.id, fullName: p.fullName, gender: p.gender,
      isAlive: p.isAlive, isMuslim: p.isMuslim,
      birthDate: p.birthDate, deathDate: p.deathDate,
      fatherId: p.fatherId, motherId: p.motherId,
    })),
    spouses: family.persons.flatMap(p =>
      p.spouses.map(s => ({
        personId: s.personId, spouseId: s.spouseId,
        marriedAt: s.marriedAt, divorcedAt: s.divorcedAt, isActive: s.isActive,
      }))
    ),
    properties: family.properties.map(prop => ({
      ownerId: prop.ownerId,
      name: prop.name, type: prop.type, subtype: prop.subtype,
      value: prop.value, currency: prop.currency,
      description: prop.description, location: prop.location,
      areaValue: prop.areaValue, areaUnit: prop.areaUnit,
      weightValue: prop.weightValue, weightUnit: prop.weightUnit,
      quantity: prop.quantity,
      make: prop.make, model: prop.model, year: prop.year,
      regNumber: prop.regNumber, ownership: prop.ownership,
      debts: prop.debts, funeralCost: prop.funeralCost, bequest: prop.bequest,
    })),
    documents: family.documents.map(d => ({
      personId: d.personId, title: d.title, category: d.category,
      description: d.description, fileLocation: d.fileLocation,
      dateCreated: d.dateCreated, dateExpires: d.dateExpires,
      isImportant: d.isImportant, notes: d.notes,
    })),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="mirath-${family.name.replace(/\s+/g, '-')}-${Date.now()}.json"`,
    },
  });
}
