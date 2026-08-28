import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized. Only trainers and admins can lock discussions.' }, { status: 401 })
    }

    const id = parseInt(resolvedParams.id, 10)
    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    const updated = await prisma.courseDiscussion.update({
      where: { id },
      data: { isLocked: !discussion.isLocked }
    })

    return NextResponse.json({ success: true, isLocked: updated.isLocked })
  } catch (err: any) {
    console.error('Error toggling discussion lock:', err)
    return NextResponse.json({ error: 'Failed to toggle lock', details: err.message }, { status: 500 })
  }
}
