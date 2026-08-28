import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        module: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, role: true, email: true } },
        student: { select: { id: true, name: true, college: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, role: true } },
            student: { select: { id: true, name: true, college: true } }
          }
        }
      }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion topic not found' }, { status: 404 })
    }

    return NextResponse.json({ discussion })
  } catch (err: any) {
    console.error('Error fetching discussion topic:', err)
    return NextResponse.json({ error: 'Failed to fetch discussion', details: err.message }, { status: 500 })
  }
}

export async function PATCH(
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
    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    const isAuthor = discussion.authorId === session.userId
    const isTrainerOrAdmin = session.role === 'trainer' || session.role === 'institution-admin'

    if (!isAuthor && !isTrainerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to edit this discussion.' }, { status: 403 })
    }

    const body = await req.json()
    const updateData: any = {}

    // Only author or admin can edit text content
    if (body.title !== undefined && (isAuthor || isTrainerOrAdmin)) updateData.title = body.title
    if (body.content !== undefined && (isAuthor || isTrainerOrAdmin)) updateData.content = body.content

    // Only trainer/admin can toggle moderation flags
    if (isTrainerOrAdmin) {
      if (body.isPinned !== undefined) updateData.isPinned = !!body.isPinned
      if (body.isLocked !== undefined) updateData.isLocked = !!body.isLocked
    }

    const updated = await prisma.courseDiscussion.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, discussion: updated })
  } catch (err: any) {
    console.error('Error updating discussion:', err)
    return NextResponse.json({ error: 'Failed to update discussion', details: err.message }, { status: 500 })
  }
}

export async function DELETE(
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
    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    const isAuthor = discussion.authorId === session.userId
    const isTrainerOrAdmin = session.role === 'trainer' || session.role === 'institution-admin'

    if (!isAuthor && !isTrainerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden. You can only delete your own discussions.' }, { status: 403 })
    }

    await prisma.courseDiscussion.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Discussion deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting discussion:', err)
    return NextResponse.json({ error: 'Failed to delete discussion', details: err.message }, { status: 500 })
  }
}
