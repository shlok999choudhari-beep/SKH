import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const moduleId = searchParams.get('moduleId')
    const search = searchParams.get('search')?.toLowerCase() || ''

    const where: any = {}
    if (courseId) where.courseId = parseInt(courseId, 10)
    if (moduleId) where.moduleId = parseInt(moduleId, 10)

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const discussions = await prisma.courseDiscussion.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, role: true } },
        student: { select: { id: true, name: true, college: true } },
        _count: { select: { replies: true } }
      }
    })

    return NextResponse.json({ discussions })
  } catch (err: any) {
    console.error('Error fetching discussions:', err)
    return NextResponse.json({ error: 'Failed to fetch discussions', details: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to start a discussion.' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId, moduleId, title, content } = body

    if (!courseId || !title || !content) {
      return NextResponse.json({ error: 'Course ID, title, and content are required' }, { status: 400 })
    }

    const parsedCourseId = parseInt(courseId, 10)

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

    const discussion = await prisma.courseDiscussion.create({
      data: {
        courseId: parsedCourseId,
        moduleId: moduleId ? parseInt(moduleId, 10) : null,
        authorId: authorUserId,
        studentId,
        title,
        content
      },
      include: {
        course: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, role: true } },
        student: { select: { id: true, name: true, college: true } },
        _count: { select: { replies: true } }
      }
    })

    return NextResponse.json({ success: true, discussion }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating discussion:', err)
    return NextResponse.json({ error: 'Failed to create discussion', details: err.message }, { status: 500 })
  }
}
