import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get('familyId');
  if (!familyId) return NextResponse.json({ error: 'familyId required' }, { status: 400 });

  const family = await prisma.family.findFirst({ where: { id: familyId, userId: user.id } });
  if (!family) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const documents = await prisma.vaultDocument.findMany({
    where: { familyId },
    include: { person: true },
    orderBy: [{ isImportant: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ documents });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await request.json();
  const family = await prisma.family.findFirst({ where: { id: data.familyId, userId: user.id } });
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const doc = await prisma.vaultDocument.create({
    data: {
      familyId: data.familyId,
      personId: data.personId || null,
      title: data.title,
      category: data.category || 'other',
      description: data.description || null,
      fileLocation: data.fileLocation || null,
      dateCreated: data.dateCreated ? new Date(data.dateCreated) : null,
      dateExpires: data.dateExpires ? new Date(data.dateExpires) : null,
      isImportant: !!data.isImportant,
      notes: data.notes || null,
    },
  });
  return NextResponse.json({ document: doc });
}
