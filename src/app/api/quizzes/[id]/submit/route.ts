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
      return NextResponse.json({ error: 'Unauthorized. Only students can submit quizzes.' }, { status: 401 })
    }

    const quizId = parseInt(resolvedParams.id, 10)
    const body = await req.json()
    const { attemptId, answers } = body

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 })
    }

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: parseInt(attemptId, 10) },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: true }
            }
          }
        }
      }
    })

    if (!attempt || attempt.quizId !== quizId || attempt.studentId !== session.userId) {
      return NextResponse.json({ error: 'Invalid attempt or unauthorized access' }, { status: 404 })
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'This quiz attempt has already been submitted.' }, { status: 400 })
    }

    const now = new Date()
    const startedAt = new Date(attempt.startedAt)
    const timeTakenSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000)

    let totalMarks = 0
    let obtainedMarks = 0
    const answerRecords: any[] = []
    const userAnswers = answers || {}

    for (const question of attempt.quiz.questions) {
      totalMarks += question.marks
      const rawUserAns = userAnswers[question.id]

      let selectedOptionIds: number[] = []
      if (Array.isArray(rawUserAns)) {
        selectedOptionIds = rawUserAns.map((id: any) => parseInt(id, 10)).filter(Boolean)
      } else if (typeof rawUserAns === 'number') {
        selectedOptionIds = [rawUserAns]
      } else if (typeof rawUserAns === 'string' && rawUserAns.trim()) {
        try {
          const parsed = JSON.parse(rawUserAns)
          selectedOptionIds = Array.isArray(parsed) ? parsed.map(Number) : [parseInt(rawUserAns, 10)]
        } catch {
          const num = parseInt(rawUserAns, 10)
          if (!isNaN(num)) selectedOptionIds = [num]
        }
      }

      const correctOptionIds = question.options
        .filter((opt: any) => opt.isCorrect)
        .map((opt: any) => opt.id)

      let isCorrect = false

      if (question.type === 'mcq' || question.type === 'true_false') {
        if (selectedOptionIds.length === 1 && correctOptionIds.includes(selectedOptionIds[0])) {
          isCorrect = true
        }
      } else if (question.type === 'multiple_select') {
        if (
          selectedOptionIds.length === correctOptionIds.length &&
          selectedOptionIds.every((id: number) => correctOptionIds.includes(id))
        ) {
          isCorrect = true
        }
      }

      const awardedMarks = isCorrect ? question.marks : 0
      obtainedMarks += awardedMarks

      answerRecords.push({
        attemptId: attempt.id,
        questionId: question.id,
        selectedOptionIds: JSON.stringify(selectedOptionIds),
        isCorrect,
        awardedMarks
      })
    }

    if (answerRecords.length > 0) {
      await prisma.quizAnswer.createMany({
        data: answerRecords
      })
    }

    const percentage = totalMarks > 0
      ? Math.round((obtainedMarks / totalMarks) * 100 * 10) / 10
      : 0
    const passed = percentage >= attempt.quiz.passingScore

    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        totalMarks,
        obtainedMarks,
        percentage,
        passed,
        status: 'completed',
        submittedAt: now,
        timeTakenSeconds
      }
    })

    // Upsert LearningProgress
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: attempt.quiz.courseId,
          studentId: session.userId
        }
      }
    })

    if (enrollment) {
      await prisma.learningProgress.upsert({
        where: {
          enrollmentId_lessonId_resourceId_assignmentId_quizId: {
            enrollmentId: enrollment.id,
            lessonId: null as any,
            resourceId: null as any,
            assignmentId: null as any,
            quizId: quizId
          }
        },
        create: {
          enrollmentId: enrollment.id,
          studentId: session.userId,
          quizId: quizId,
          isCompleted: passed,
          completedAt: passed ? now : null
        },
        update: {
          isCompleted: passed,
          completedAt: passed ? now : undefined
        }
      })

      const totalLessons = await prisma.courseLesson.count({
        where: { module: { courseId: attempt.quiz.courseId } }
      })
      const totalAssignments = await prisma.assignment.count({
        where: { courseId: attempt.quiz.courseId, status: 'published' }
      })
      const totalQuizzes = await prisma.quiz.count({
        where: { courseId: attempt.quiz.courseId, status: 'published' }
      })
      const totalItems = (totalLessons || 0) + (totalAssignments || 0) + (totalQuizzes || 0)

      const completedProgressCount = await prisma.learningProgress.count({
        where: {
          enrollmentId: enrollment.id,
          isCompleted: true
        }
      })

      const newProgressPercent = totalItems > 0
        ? Math.min(100, Math.round((completedProgressCount / totalItems) * 100))
        : 0

      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          progressPercent: newProgressPercent,
          status: newProgressPercent === 100 ? 'completed' : 'active',
          completedAt: newProgressPercent === 100 ? now : null,
          lastAccessedAt: now
        }
      })
    }

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      totalMarks,
      obtainedMarks,
      percentage,
      passed,
      timeTakenSeconds,
      showResultsAfter: attempt.quiz.showResultsAfter
    })
  } catch (err: any) {
    console.error('Error evaluating quiz submission:', err)
    return NextResponse.json({ error: 'Failed to submit quiz', details: err.message }, { status: 500 })
  }
}
