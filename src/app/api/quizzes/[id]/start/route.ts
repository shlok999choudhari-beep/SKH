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
    if (!session || session.role !== 'student' || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. Only students can attempt quizzes.' }, { status: 401 })
    }

    const quizId = parseInt(resolvedParams.id, 10)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: true,
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.status !== 'published') {
      return NextResponse.json({ error: 'This quiz is currently unavailable.' }, { status: 403 })
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: quiz.courseId,
          studentId: session.userId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'You must be enrolled in this course to take the quiz.' }, { status: 403 })
    }

    // Check attempt limits
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        studentId: session.userId
      }
    })

    if (quiz.maxAttempts > 0 && existingAttempts.length >= quiz.maxAttempts) {
      return NextResponse.json({
        error: `Maximum attempts limit reached (${quiz.maxAttempts} attempts allowed).`
      }, { status: 403 })
    }

    const nextAttemptNumber = existingAttempts.length + 1

    // Create Attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: session.userId,
        attemptNumber: nextAttemptNumber,
        status: 'in_progress',
        startedAt: new Date()
      }
    })

    // Prepare sanitized questions
    let questions = quiz.questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      marks: q.marks,
      orderIndex: q.orderIndex,
      options: q.options.map((opt: any) => ({
        id: opt.id,
        optionText: opt.optionText,
        orderIndex: opt.orderIndex
      }))
    }))

    if (quiz.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5)
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt,
      timeLimit: quiz.timeLimit,
      quizTitle: quiz.title,
      totalQuestions: questions.length,
      questions
    })
  } catch (err: any) {
    console.error('Error starting quiz attempt:', err)
    return NextResponse.json({ error: 'Failed to start quiz attempt', details: err.message }, { status: 500 })
  }
}
