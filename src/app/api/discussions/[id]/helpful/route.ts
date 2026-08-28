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
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(resolvedParams.id, 10)
    const updated = await prisma.courseDiscussion.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } }
    })

    return NextResponse.json({ success: true, helpfulCount: updated.helpfulCount })
  } catch (err: any) {
    console.error('Error marking discussion helpful:', err)
    return NextResponse.json({ error: 'Failed to mark helpful', details: err.message }, { status: 500 })
  }
}
