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
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quizId = parseInt(resolvedParams.id, 10)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const nextStatus = quiz.status === 'published' ? 'draft' : 'published'
    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: { status: nextStatus }
    })

    return NextResponse.json({ success: true, status: updated.status })
  } catch (err: any) {
    console.error('Error toggling quiz status:', err)
    return NextResponse.json({ error: 'Failed to update quiz status', details: err.message }, { status: 500 })
  }
}
