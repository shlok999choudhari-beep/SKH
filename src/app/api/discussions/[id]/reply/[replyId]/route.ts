import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const replyId = parseInt(resolvedParams.replyId, 10)
    const reply = await prisma.discussionReply.findUnique({
      where: { id: replyId }
    })

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    const isAuthor = reply.authorId === session.userId
    const isTrainerOrAdmin = session.role === 'trainer' || session.role === 'institution-admin'

    const body = await req.json()
    const updateData: any = {}

    if (body.content !== undefined) {
      if (!isAuthor && !isTrainerOrAdmin) {
        return NextResponse.json({ error: 'Forbidden. You can only edit your own replies.' }, { status: 403 })
      }
      updateData.content = body.content.trim()
    }

    if (body.isHelpful !== undefined && isTrainerOrAdmin) {
      updateData.isHelpful = !!body.isHelpful
    }

    const updated = await prisma.discussionReply.update({
      where: { id: replyId },
      data: updateData
    })

    return NextResponse.json({ success: true, reply: updated })
  } catch (err: any) {
    console.error('Error updating reply:', err)
    return NextResponse.json({ error: 'Failed to update reply', details: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const replyId = parseInt(resolvedParams.replyId, 10)
    const reply = await prisma.discussionReply.findUnique({
      where: { id: replyId }
    })

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    }

    const isAuthor = reply.authorId === session.userId
    const isTrainerOrAdmin = session.role === 'trainer' || session.role === 'institution-admin'

    if (!isAuthor && !isTrainerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden. You can only delete your own replies.' }, { status: 403 })
    }

    await prisma.discussionReply.delete({
      where: { id: replyId }
    })

    return NextResponse.json({ success: true, message: 'Reply deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting reply:', err)
    return NextResponse.json({ error: 'Failed to delete reply', details: err.message }, { status: 500 })
  }
}
