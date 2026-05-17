import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    if (!data.mirathVersion || !data.family || !Array.isArray(data.persons)) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    const family = await prisma.family.create({
      data: {
        name: data.family.name + ' (Imported)',
        description: data.family.description || null,
        userId: user.id,
      },
    });

    const idMap = new Map();

    for (const p of data.persons) {
      const created = await prisma.person.create({
        data: {
          familyId: family.id,
          fullName: p.fullName, gender: p.gender,
          isAlive: p.isAlive, isMuslim: p.isMuslim,
          birthDate: p.birthDate ? new Date(p.birthDate) : null,
          deathDate: p.deathDate ? new Date(p.deathDate) : null,
        },
      });
      idMap.set(p.id, created.id);
    }

    for (const p of data.persons) {
      const updates = {};
      if (p.fatherId && idMap.has(p.fatherId)) updates.fatherId = idMap.get(p.fatherId);
      if (p.motherId && idMap.has(p.motherId)) updates.motherId = idMap.get(p.motherId);
      if (Object.keys(updates).length > 0) {
        await prisma.person.update({ where: { id: idMap.get(p.id) }, data: updates });
      }
    }

    const seenSpouse = new Set();
    for (const s of data.spouses || []) {
      const np = idMap.get(s.personId), ns = idMap.get(s.spouseId);
      if (!np || !ns) continue;
      const key = [np, ns].sort().join('|');
      if (seenSpouse.has(key)) continue;
      seenSpouse.add(key);
      try {
        await prisma.spouse.create({
          data: {
            personId: np, spouseId: ns,
            marriedAt: s.marriedAt ? new Date(s.marriedAt) : null,
            divorcedAt: s.divorcedAt ? new Date(s.divorcedAt) : null,
            isActive: s.isActive !== false,
          },
        });
      } catch (e) {}
    }

    for (const prop of data.properties || []) {
      const newOwnerId = idMap.get(prop.ownerId);
      if (!newOwnerId) continue;
      await prisma.property.create({
        data: {
          familyId: family.id, ownerId: newOwnerId,
          name: prop.name, type: prop.type, subtype: prop.subtype || null,
          value: prop.value || 0, currency: prop.currency || 'PKR',
          description: prop.description, location: prop.location,
          areaValue: prop.areaValue || null, areaUnit: prop.areaUnit || null,
          weightValue: prop.weightValue || null, weightUnit: prop.weightUnit || null,
          quantity: prop.quantity || null,
          make: prop.make, model: prop.model, year: prop.year,
          regNumber: prop.regNumber, ownership: prop.ownership,
          debts: prop.debts || 0, funeralCost: prop.funeralCost || 0, bequest: prop.bequest || 0,
        },
      });
    }

    for (const d of data.documents || []) {
      const newPersonId = d.personId && idMap.get(d.personId);
      await prisma.vaultDocument.create({
        data: {
          familyId: family.id,
          personId: newPersonId || null,
          title: d.title, category: d.category,
          description: d.description, fileLocation: d.fileLocation,
          dateCreated: d.dateCreated ? new Date(d.dateCreated) : null,
          dateExpires: d.dateExpires ? new Date(d.dateExpires) : null,
          isImportant: !!d.isImportant, notes: d.notes,
        },
      });
    }

    return NextResponse.json({
      family,
      imported: {
        persons: data.persons.length,
        spouses: data.spouses?.length || 0,
        properties: data.properties?.length || 0,
        documents: data.documents?.length || 0,
      },
    });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 });
  }
}
