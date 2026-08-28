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
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quizId = parseInt(resolvedParams.id, 10)
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        studentId: session.userId
      },
      orderBy: { attemptNumber: 'desc' },
      select: {
        id: true,
        attemptNumber: true,
        startedAt: true,
        submittedAt: true,
        timeTakenSeconds: true,
        totalMarks: true,
        obtainedMarks: true,
        percentage: true,
        passed: true,
        status: true
      }
    })

    return NextResponse.json({ attempts })
  } catch (err: any) {
    console.error('Error fetching quiz attempts:', err)
    return NextResponse.json({ error: 'Failed to fetch attempts', details: err.message }, { status: 500 })
  }
}
