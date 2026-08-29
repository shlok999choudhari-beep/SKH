import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const createQuizSchema = z.object({
  moduleId: z.number().nullable().optional(),
  title: z.string().min(1, 'Quiz title is required'),
  description: z.string().optional(),
  timeLimit: z.number().default(20),
  maxAttempts: z.number().default(3),
  passingScore: z.number().default(60),
  randomizeQuestions: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  questions: z.array(
    z.object({
      question: z.string().min(1),
      type: z.enum(['mcq', 'multiple_select', 'true_false']).default('mcq'),
      marks: z.number().default(1),
      explanation: z.string().optional(),
      options: z.array(
        z.object({
          optionText: z.string().min(1),
          isCorrect: z.boolean().default(false)
        })
      )
    })
  ).optional()
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
    const validated = createQuizSchema.parse(body)

    let trainerId: number | null = null
    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({ where: { userId: session.userId } })
      if (trainer) trainerId = trainer.id
    }

    const highest = await prisma.quiz.findFirst({
      where: { courseId, ...(validated.moduleId ? { moduleId: validated.moduleId } : {}) },
      orderBy: { orderIndex: 'desc' }
    })
    const orderIndex = (highest?.orderIndex ?? -1) + 1

    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        moduleId: validated.moduleId || null,
        trainerId,
        title: validated.title,
        description: validated.description || '',
        timeLimit: validated.timeLimit,
        maxAttempts: validated.maxAttempts,
        passingScore: validated.passingScore,
        randomizeQuestions: validated.randomizeQuestions,
        status: validated.status,
        orderIndex,
        questions: validated.questions && validated.questions.length > 0 ? {
          create: validated.questions.map((q, qIdx) => ({
            question: q.question,
            type: q.type,
            marks: q.marks,
            explanation: q.explanation || null,
            orderIndex: qIdx,
            options: {
              create: q.options.map((opt, oIdx) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                orderIndex: oIdx
              }))
            }
          }))
        } : undefined
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, quiz }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error creating quiz:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
