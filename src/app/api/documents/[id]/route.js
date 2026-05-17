import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const doc = await prisma.vaultDocument.findUnique({
    where: { id: params.id },
    include: { family: true },
  });
  if (!doc || doc.family.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.vaultDocument.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
