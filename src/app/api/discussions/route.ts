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

    // Verify enrollment or instructor status
    if (session.role === 'student') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: parsedCourseId,
            studentId: session.userId
          }
        }
      })
      if (!enrollment) {
        return NextResponse.json({ error: 'You must be enrolled in this course to post discussions.' }, { status: 403 })
      }
    }

    const discussion = await prisma.courseDiscussion.create({
      data: {
        courseId: parsedCourseId,
        moduleId: moduleId ? parseInt(moduleId, 10) : null,
        authorId: session.userId,
        studentId: session.role === 'student' ? session.userId : null,
        title,
        content
      },
      include: {
        course: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, role: true } },
        _count: { select: { replies: true } }
      }
    })

    return NextResponse.json({ success: true, discussion }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating discussion:', err)
    return NextResponse.json({ error: 'Failed to create discussion', details: err.message }, { status: 500 })
  }
}
