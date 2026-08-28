import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const createResourceSchema = z.object({
  moduleId: z.number().nullable().optional(),
  lessonId: z.number().nullable().optional(),
  title: z.string().min(1, 'Resource title is required'),
  type: z.enum(['PDF', 'VIDEO', 'DOCUMENT', 'EXTERNAL']).default('PDF'),
  url: z.string().min(1, 'Resource URL or file path is required'),
  fileSize: z.number().nullable().optional(),
  orderIndex: z.number().optional()
})

// POST /api/courses/[id]/resources - Add resource to course/module/lesson
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
    const validated = createResourceSchema.parse(body)

    let orderIndex = validated.orderIndex
    if (orderIndex === undefined) {
      const highest = await prisma.courseResource.findFirst({
        where: {
          ...(validated.lessonId ? { lessonId: validated.lessonId } : {}),
          ...(validated.moduleId ? { moduleId: validated.moduleId } : {})
        },
        orderBy: { orderIndex: 'desc' }
      })
      orderIndex = (highest?.orderIndex ?? -1) + 1
    }

    const newResource = await prisma.courseResource.create({
      data: {
        moduleId: validated.moduleId || null,
        lessonId: validated.lessonId || null,
        title: validated.title,
        type: validated.type,
        url: validated.url,
        fileSize: validated.fileSize || null,
        orderIndex
      }
    })

    return NextResponse.json({ success: true, resource: newResource }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error creating resource:', error)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}
