import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

async function checkOwnership(personId, userId) {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { family: true },
  });
  if (!person || person.family.userId !== userId) return null;
  return person;
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owned = await checkOwnership(params.id, user.id);
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await request.json();
  const updates = {};
  const allowed = ['fullName', 'gender', 'isAlive', 'isMuslim', 'fatherId', 'motherId'];
  for (const k of allowed) {
    if (k in data) updates[k] = data[k];
  }
  if ('birthDate' in data) updates.birthDate = data.birthDate ? new Date(data.birthDate) : null;
  if ('deathDate' in data) updates.deathDate = data.deathDate ? new Date(data.deathDate) : null;

  const person = await prisma.person.update({
    where: { id: params.id },
    data: updates,
  });
  return NextResponse.json({ person });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const owned = await checkOwnership(params.id, user.id);
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.person.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
