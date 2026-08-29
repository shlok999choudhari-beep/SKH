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

    let studentId: number | null = null
    let authorUserId: number = 1

    if (session.role === 'student') {
      const student = await prisma.student.findUnique({ where: { id: session.userId } })
      if (student) {
        studentId = student.id
      }
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: session.userId },
            ...(session.email ? [{ email: session.email }] : [])
          ]
        }
      })
      if (user) {
        authorUserId = user.id
      } else {
        const fallbackUser = await prisma.user.findFirst()
        if (fallbackUser) authorUserId = fallbackUser.id
      }
    } else {
      const user = await prisma.user.findUnique({ where: { id: session.userId } })
      if (user) {
        authorUserId = user.id
      } else {
        const fallbackUser = await prisma.user.findFirst()
        if (fallbackUser) authorUserId = fallbackUser.id
      }
    }

    const reply = await prisma.discussionReply.create({
      data: {
        discussionId,
        authorId: authorUserId,
        studentId,
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
