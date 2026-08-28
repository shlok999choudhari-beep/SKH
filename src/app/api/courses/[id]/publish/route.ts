import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// POST /api/courses/[id]/publish - Toggle publish/draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (!trainerRecord || course.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden: You can only publish your own courses' }, { status: 403 })
      }
    }

    const nextStatus = course.status === 'published' ? 'draft' : 'published'

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { status: nextStatus }
    })

    return NextResponse.json({ success: true, status: updated.status })
  } catch (error: any) {
    console.error('Error toggling course publish status:', error)
    return NextResponse.json({ error: 'Failed to update course status' }, { status: 500 })
  }
}
