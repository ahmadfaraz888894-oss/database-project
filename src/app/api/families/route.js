import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const families = await prisma.family.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { persons: true, properties: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ families });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const family = await prisma.family.create({
    data: { name, description, userId: user.id },
  });
  return NextResponse.json({ family });
}
