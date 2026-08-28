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
    const quizId = parseInt(resolvedParams.id, 10)

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          select: { id: true, title: true, slug: true, category: { select: { name: true } }, trainer: { select: { user: { select: { name: true } } } } }
        },
        module: {
          select: { id: true, title: true }
        },
        questions: {
          select: { id: true, marks: true, type: true }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const totalMarks = quiz.questions?.reduce((acc: number, curr: any) => acc + curr.marks, 0) || 0

    let studentAttempts: any[] = []
    if (session?.role === 'student' && session?.userId) {
      studentAttempts = await prisma.quizAttempt.findMany({
        where: {
          quizId,
          studentId: session.userId
        },
        orderBy: { attemptNumber: 'desc' }
      })
    }

    const attemptsUsed = studentAttempts.length
    const canAttempt = quiz.maxAttempts === 0 || attemptsUsed < quiz.maxAttempts
    const bestAttempt = studentAttempts.length > 0
      ? [...studentAttempts].sort((a, b) => b.percentage - a.percentage)[0]
      : null

    return NextResponse.json({
      quiz: {
        ...quiz,
        totalMarks,
        questionCount: quiz.questions?.length || 0,
        studentStats: session?.role === 'student' ? {
          attemptsUsed,
          canAttempt,
          bestScore: bestAttempt ? bestAttempt.obtainedMarks : null,
          bestPercentage: bestAttempt ? bestAttempt.percentage : null,
          hasPassed: studentAttempts.some(a => a.passed),
          attempts: studentAttempts
        } : null
      }
    })
  } catch (err: any) {
    console.error('Error fetching quiz details:', err)
    return NextResponse.json({ error: 'Failed to fetch quiz details', details: err.message }, { status: 500 })
  }
}

export async function PATCH(
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
    const body = await req.json()

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.moduleId !== undefined) data.moduleId = body.moduleId ? parseInt(body.moduleId, 10) : null
    if (body.timeLimit !== undefined) data.timeLimit = parseInt(body.timeLimit, 10)
    if (body.maxAttempts !== undefined) data.maxAttempts = parseInt(body.maxAttempts, 10)
    if (body.passingScore !== undefined) data.passingScore = parseFloat(body.passingScore)
    if (body.randomizeQuestions !== undefined) data.randomizeQuestions = !!body.randomizeQuestions
    if (body.showResultsAfter !== undefined) data.showResultsAfter = !!body.showResultsAfter
    if (body.status !== undefined) data.status = body.status
    if (body.orderIndex !== undefined) data.orderIndex = parseInt(body.orderIndex, 10)

    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data
    })

    return NextResponse.json({ success: true, quiz: updated })
  } catch (err: any) {
    console.error('Error updating quiz:', err)
    return NextResponse.json({ error: 'Failed to update quiz', details: err.message }, { status: 500 })
  }
}

export async function DELETE(
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
    await prisma.quiz.delete({
      where: { id: quizId }
    })

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting quiz:', err)
    return NextResponse.json({ error: 'Failed to delete quiz', details: err.message }, { status: 500 })
  }
}
