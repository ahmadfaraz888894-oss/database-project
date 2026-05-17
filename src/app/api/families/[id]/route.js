import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await prisma.family.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      persons: {
        include: {
          spouses: { include: { spouse: true } },
          spousesOf: { include: { person: true } },
          properties: true,
        },
      },
      properties: { include: { owner: true } },
    },
  });

  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ family });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await prisma.family.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.family.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
