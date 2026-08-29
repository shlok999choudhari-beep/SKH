import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const createAssignmentSchema = z.object({
  moduleId: z.number().nullable().optional(),
  title: z.string().min(1, 'Assignment title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  maxMarks: z.number().optional().default(10),
  allowedFileTypes: z.string().optional().default('pdf,zip,png,jpg,cpp'),
  submissionType: z.enum(['file_upload', 'text_submission', 'both']).optional().default('file_upload'),
  status: z.enum(['draft', 'published']).optional().default('published')
})

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

    const body = await request.json()
    const validated = createAssignmentSchema.parse(body)

    let trainerId: number | null = null
    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({ where: { userId: session.userId } })
      if (trainer) trainerId = trainer.id
    }

    const highest = await prisma.assignment.findFirst({
      where: { courseId, ...(validated.moduleId ? { moduleId: validated.moduleId } : {}) },
      orderBy: { orderIndex: 'desc' }
    })
    const orderIndex = (highest?.orderIndex ?? -1) + 1

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        moduleId: validated.moduleId || null,
        trainerId,
        title: validated.title,
        description: validated.description || '',
        dueDate: validated.dueDate ? new Date(validated.dueDate) : new Date(Date.now() + 7 * 86400000),
        maxMarks: validated.maxMarks || 10,
        allowedFileTypes: validated.allowedFileTypes || 'pdf,zip,png,jpg,cpp',
        submissionType: validated.submissionType || 'file_upload',
        status: validated.status || 'published',
        orderIndex
      }
    })

    return NextResponse.json({ success: true, assignment }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment', details: error.message }, { status: 500 })
  }
}
