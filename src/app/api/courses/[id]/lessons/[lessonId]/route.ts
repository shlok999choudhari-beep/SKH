import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().nullable().optional(),
  orderIndex: z.number().optional()
})

// PATCH /api/courses/[id]/lessons/[lessonId] - Update lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    const lessonId = parseInt(resolvedParams.lessonId, 10)

    if (isNaN(courseId) || isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({ where: { userId: session.userId } })
      if (!trainerRecord || course.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const validated = updateLessonSchema.parse(body)

    const updated = await prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.duration !== undefined && { duration: validated.duration }),
        ...(validated.content !== undefined && { content: validated.content }),
        ...(validated.videoUrl !== undefined && { videoUrl: validated.videoUrl }),
        ...(validated.orderIndex !== undefined && { orderIndex: validated.orderIndex })
      },
      include: {
        resources: true
      }
    })

    return NextResponse.json({ success: true, lesson: updated })
  } catch (error: any) {
    console.error('Error updating lesson:', error)
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
  }
}

// DELETE /api/courses/[id]/lessons/[lessonId] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    const lessonId = parseInt(resolvedParams.lessonId, 10)

    if (isNaN(courseId) || isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({ where: { userId: session.userId } })
      if (!trainerRecord || course.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await prisma.courseLesson.delete({
      where: { id: lessonId }
    })

    return NextResponse.json({ success: true, message: 'Lesson deleted' })
  } catch (error: any) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
  }
}
