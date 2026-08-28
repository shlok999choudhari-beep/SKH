import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attemptId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quizId = parseInt(resolvedParams.id, 10)
    const attemptId = parseInt(resolvedParams.attemptId, 10)

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        quiz: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                options: {
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          }
        },
        answers: true
      }
    })

    if (!attempt || attempt.quizId !== quizId) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (session.role === 'student' && attempt.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const answersMap: Record<number, any> = {}
    attempt.answers.forEach((ans: any) => {
      let selectedIds = []
      try {
        selectedIds = JSON.parse(ans.selectedOptionIds)
      } catch {
        selectedIds = [ans.selectedOptionIds]
      }
      answersMap[ans.questionId] = {
        selectedOptionIds: selectedIds,
        isCorrect: ans.isCorrect,
        awardedMarks: ans.awardedMarks
      }
    })

    const questionsBreakdown = attempt.quiz.questions.map((q: any) => {
      const studentAns = answersMap[q.id] || {
        selectedOptionIds: [],
        isCorrect: false,
        awardedMarks: 0
      }

      return {
        id: q.id,
        type: q.type,
        question: q.question,
        marks: q.marks,
        explanation: q.explanation,
        options: q.options.map((opt: any) => ({
          id: opt.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect
        })),
        studentAnswer: studentAns
      }
    })

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        studentName: attempt.student?.name,
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeTakenSeconds: attempt.timeTakenSeconds,
        totalMarks: attempt.totalMarks,
        obtainedMarks: attempt.obtainedMarks,
        percentage: attempt.percentage,
        passed: attempt.passed,
        passingScore: attempt.quiz.passingScore,
        status: attempt.status,
        questions: questionsBreakdown
      }
    })
  } catch (err: any) {
    console.error('Error fetching quiz attempt result:', err)
    return NextResponse.json({ error: 'Failed to fetch result', details: err.message }, { status: 500 })
  }
}
