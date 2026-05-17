import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await request.json();
  const { familyId, fullName, gender, isAlive, isMuslim, birthDate, deathDate, fatherId, motherId, spouseIds } = data;

  // Verify family belongs to user
  const family = await prisma.family.findFirst({
    where: { id: familyId, userId: user.id },
  });
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const person = await prisma.person.create({
    data: {
      familyId,
      fullName,
      gender,
      isAlive: isAlive !== false,
      isMuslim: isMuslim !== false,
      birthDate: birthDate ? new Date(birthDate) : null,
      deathDate: deathDate ? new Date(deathDate) : null,
      fatherId: fatherId || null,
      motherId: motherId || null,
    },
  });

  // Create spouse relationships
  if (spouseIds && spouseIds.length > 0) {
    for (const spouseId of spouseIds) {
      await prisma.spouse.create({
        data: { personId: person.id, spouseId, isActive: true },
      });
    }
  }

  return NextResponse.json({ person });
}
