import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quizId = parseInt(resolvedParams.id, 10)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: true,
            answers: true
          }
        },
        attempts: {
          where: { status: 'completed' },
          include: {
            student: { select: { id: true, name: true, email: true, college: true } }
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const attempts = quiz.attempts || []
    const totalAttempts = attempts.length

    let avgScore = 0
    let highestScore = 0
    let lowestScore = 0
    let passCount = 0

    if (totalAttempts > 0) {
      const scores = attempts.map(a => a.percentage)
      avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / totalAttempts) * 10) / 10
      highestScore = Math.max(...scores)
      lowestScore = Math.min(...scores)
      passCount = attempts.filter(a => a.passed).length
    }

    const passRate = totalAttempts > 0
      ? Math.round((passCount / totalAttempts) * 100)
      : 0

    const questionAnalytics = quiz.questions.map((q: any) => {
      const totalAnswers = q.answers?.length || 0
      const correctAnswers = q.answers?.filter((a: any) => a.isCorrect).length || 0
      const accuracyPercent = totalAnswers > 0
        ? Math.round((correctAnswers / totalAnswers) * 100)
        : 0

      return {
        id: q.id,
        type: q.type,
        question: q.question,
        marks: q.marks,
        totalAnswers,
        correctCount: correctAnswers,
        incorrectCount: totalAnswers - correctAnswers,
        accuracyPercent
      }
    })

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        courseTitle: quiz.course?.title,
        moduleTitle: quiz.module?.title,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        maxAttempts: quiz.maxAttempts,
        status: quiz.status
      },
      stats: {
        totalAttempts,
        uniqueStudents: new Set(attempts.map(a => a.studentId)).size,
        avgScore,
        highestScore,
        lowestScore,
        passRate,
        passCount
      },
      questionAnalytics,
      recentAttempts: attempts.slice(0, 15).map(a => ({
        id: a.id,
        studentName: a.student?.name || 'Student',
        studentEmail: a.student?.email,
        attemptNumber: a.attemptNumber,
        percentage: a.percentage,
        passed: a.passed,
        submittedAt: a.submittedAt,
        timeTakenSeconds: a.timeTakenSeconds
      }))
    })
  } catch (err: any) {
    console.error('Error fetching quiz analytics:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics', details: err.message }, { status: 500 })
  }
}
