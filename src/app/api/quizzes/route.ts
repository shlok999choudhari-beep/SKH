import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const moduleId = searchParams.get('moduleId')
    const status = searchParams.get('status')

    const where: any = {}
    if (courseId) where.courseId = parseInt(courseId, 10)
    if (moduleId) where.moduleId = parseInt(moduleId, 10)

    if (!session || session.role === 'student') {
      where.status = 'published'
    } else if (status && status !== 'all') {
      where.status = status
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        course: {
          select: { id: true, title: true, slug: true, category: { select: { name: true } } }
        },
        module: {
          select: { id: true, title: true }
        },
        questions: {
          select: { id: true, marks: true }
        },
        attempts: session?.role === 'student' && session?.userId ? {
          where: { studentId: session.userId },
          orderBy: { percentage: 'desc' }
        } : {
          select: { id: true, percentage: true, passed: true }
        }
      }
    })

    const formatted = quizzes.map((q: any) => {
      const totalMarks = q.questions?.reduce((acc: number, curr: any) => acc + curr.marks, 0) || 0
      const questionCount = q.questions?.length || 0

      let studentBestPercentage = null
      let studentAttemptsCount = 0
      let studentPassed = false

      if (session?.role === 'student' && q.attempts) {
        studentAttemptsCount = q.attempts.length
        if (studentAttemptsCount > 0) {
          studentBestPercentage = q.attempts[0].percentage
          studentPassed = q.attempts.some((att: any) => att.passed)
        }
      }

      const totalAttempts = q.attempts?.length || 0
      const avgScore = totalAttempts > 0
        ? Math.round(q.attempts.reduce((acc: number, a: any) => acc + a.percentage, 0) / totalAttempts)
        : 0

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        courseId: q.courseId,
        courseTitle: q.course?.title,
        courseCategory: q.course?.category?.name,
        moduleId: q.moduleId,
        moduleTitle: q.module?.title,
        timeLimit: q.timeLimit,
        maxAttempts: q.maxAttempts,
        passingScore: q.passingScore,
        randomizeQuestions: q.randomizeQuestions,
        showResultsAfter: q.showResultsAfter,
        status: q.status,
        orderIndex: q.orderIndex,
        createdAt: q.createdAt,
        questionCount,
        totalMarks,
        totalAttempts,
        avgScore,
        studentBestPercentage,
        studentAttemptsCount,
        studentPassed
      }
    })

    return NextResponse.json({ quizzes: formatted })
  } catch (err: any) {
    console.error('Error fetching quizzes:', err)
    return NextResponse.json({ error: 'Failed to fetch quizzes', details: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      courseId,
      moduleId,
      title,
      description,
      timeLimit,
      maxAttempts,
      passingScore,
      randomizeQuestions,
      showResultsAfter,
      status
    } = body

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Course and title are required' }, { status: 400 })
    }

    let trainerId: number | null = null
    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainer) trainerId = trainer.id
    }

    const quiz = await prisma.quiz.create({
      data: {
        courseId: parseInt(courseId, 10),
        moduleId: moduleId ? parseInt(moduleId, 10) : null,
        trainerId,
        title,
        description: description || '',
        timeLimit: timeLimit !== undefined ? parseInt(timeLimit, 10) : 30,
        maxAttempts: maxAttempts !== undefined ? parseInt(maxAttempts, 10) : 3,
        passingScore: passingScore !== undefined ? parseFloat(passingScore) : 60,
        randomizeQuestions: !!randomizeQuestions,
        showResultsAfter: showResultsAfter !== undefined ? !!showResultsAfter : true,
        status: status || 'draft'
      }
    })

    return NextResponse.json({ success: true, quiz }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating quiz:', err)
    return NextResponse.json({ error: 'Failed to create quiz', details: err.message }, { status: 500 })
  }
}
