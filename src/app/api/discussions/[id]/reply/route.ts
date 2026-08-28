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
      return NextResponse.json({ error: 'Unauthorized. Please log in to reply.' }, { status: 401 })
    }

    const discussionId = parseInt(resolvedParams.id, 10)
    const discussion = await prisma.courseDiscussion.findUnique({
      where: { id: discussionId }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion topic not found' }, { status: 404 })
    }

    if (discussion.isLocked) {
      return NextResponse.json({ error: 'This discussion thread has been locked by the instructor.' }, { status: 403 })
    }

    const body = await req.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Reply content cannot be empty' }, { status: 400 })
    }

    const reply = await prisma.discussionReply.create({
      data: {
        discussionId,
        authorId: session.userId,
        studentId: session.role === 'student' ? session.userId : null,
        content: content.trim()
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
        student: { select: { id: true, name: true, college: true } }
      }
    })

    return NextResponse.json({ success: true, reply }, { status: 201 })
  } catch (err: any) {
    console.error('Error adding reply:', err)
    return NextResponse.json({ error: 'Failed to add reply', details: err.message }, { status: 500 })
  }
}
