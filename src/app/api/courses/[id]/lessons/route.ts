import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const createLessonSchema = z.object({
  moduleId: z.number(),
  title: z.string().min(1, 'Lesson title is required'),
  description: z.string().optional(),
  duration: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  orderIndex: z.number().optional()
})

// POST /api/courses/[id]/lessons - Add lesson to a module
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

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({ where: { userId: session.userId } })
      if (!trainerRecord || course.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const validated = createLessonSchema.parse(body)

    let orderIndex = validated.orderIndex
    if (orderIndex === undefined) {
      const highest = await prisma.courseLesson.findFirst({
        where: { moduleId: validated.moduleId },
        orderBy: { orderIndex: 'desc' }
      })
      orderIndex = (highest?.orderIndex ?? -1) + 1
    }

    const newLesson = await prisma.courseLesson.create({
      data: {
        moduleId: validated.moduleId,
        title: validated.title,
        description: validated.description || '',
        duration: validated.duration || '15 mins',
        content: validated.content || '',
        videoUrl: validated.videoUrl || null,
        orderIndex
      },
      include: {
        resources: true
      }
    })

    return NextResponse.json({ success: true, lesson: newLesson }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
  }
}
