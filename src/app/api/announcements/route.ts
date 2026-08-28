import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const moduleId = searchParams.get('moduleId')

    const where: any = {}
    if (courseId) where.courseId = parseInt(courseId, 10)
    if (moduleId) where.moduleId = parseInt(moduleId, 10)

    // For students or unauthenticated users, only show published announcements
    if (!session || session.role === 'student') {
      where.status = 'published'
    }

    const announcements = await prisma.courseAnnouncement.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, role: true } }
      }
    })

    return NextResponse.json({ announcements })
  } catch (err: any) {
    console.error('Error listing announcements:', err)
    return NextResponse.json({ error: 'Failed to fetch announcements', details: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized. Only trainers and admins can create announcements.' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId, moduleId, title, content, isPinned, status } = body

    if (!courseId || !title || !content) {
      return NextResponse.json({ error: 'Course, title, and content are required' }, { status: 400 })
    }

    let trainerId: number | null = null
    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainer) trainerId = trainer.id
    }

    const announcement = await prisma.courseAnnouncement.create({
      data: {
        courseId: parseInt(courseId, 10),
        moduleId: moduleId ? parseInt(moduleId, 10) : null,
        authorId: session.userId,
        trainerId,
        title,
        content,
        isPinned: !!isPinned,
        status: status || 'published'
      },
      include: {
        course: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, role: true } }
      }
    })

    return NextResponse.json({ success: true, announcement }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating announcement:', err)
    return NextResponse.json({ error: 'Failed to create announcement', details: err.message }, { status: 500 })
  }
}
