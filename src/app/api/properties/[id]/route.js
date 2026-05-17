import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

async function check(id, userId) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: { family: true },
  });
  if (!property || property.family.userId !== userId) return null;
  return property;
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const property = await check(params.id, user.id);
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.property.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const property = await check(params.id, user.id);
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await request.json();
  const updates = {};
  const fields = [
    'name', 'type', 'subtype', 'currency', 'description', 'location',
    'areaUnit', 'weightUnit', 'make', 'model', 'regNumber',
  ];
  for (const f of fields) if (f in data) updates[f] = data[f];

  const numFields = ['value', 'areaValue', 'weightValue', 'quantity', 'ownership', 'debts', 'funeralCost', 'bequest'];
  for (const f of numFields) if (f in data) updates[f] = data[f] ? parseFloat(data[f]) : null;
  if ('year' in data) updates.year = data.year ? parseInt(data.year) : null;

  const updated = await prisma.property.update({ where: { id: params.id }, data: updates });
  return NextResponse.json({ property: updated });
}
