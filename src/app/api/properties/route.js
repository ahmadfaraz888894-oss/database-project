import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await request.json();
  const family = await prisma.family.findFirst({ where: { id: data.familyId, userId: user.id } });
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const property = await prisma.property.create({
    data: {
      familyId: data.familyId,
      ownerId: data.ownerId,
      name: data.name,
      type: data.type || 'other',
      subtype: data.subtype || null,
      value: parseFloat(data.value) || 0,
      currency: data.currency || 'PKR',
      description: data.description || null,
      location: data.location || null,
      areaValue: data.areaValue ? parseFloat(data.areaValue) : null,
      areaUnit: data.areaUnit || null,
      weightValue: data.weightValue ? parseFloat(data.weightValue) : null,
      weightUnit: data.weightUnit || null,
      quantity: data.quantity ? parseFloat(data.quantity) : null,
      make: data.make || null,
      model: data.model || null,
      year: data.year ? parseInt(data.year) : null,
      regNumber: data.regNumber || null,
      ownership: data.ownership ? parseFloat(data.ownership) : null,
      debts: parseFloat(data.debts) || 0,
      funeralCost: parseFloat(data.funeralCost) || 0,
      bequest: parseFloat(data.bequest) || 0,
    },
  });
  return NextResponse.json({ property });
}
