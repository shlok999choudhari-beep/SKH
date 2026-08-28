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
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { orderIndex: 'asc' },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return NextResponse.json({ questions })
  } catch (err: any) {
    console.error('Error fetching quiz questions:', err)
    return NextResponse.json({ error: 'Failed to fetch quiz questions', details: err.message }, { status: 500 })
  }
}

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
    const body = await req.json()
    const { type, question, marks, explanation, orderIndex, options } = body

    if (!question || !type) {
      return NextResponse.json({ error: 'Question text and type are required' }, { status: 400 })
    }

    let finalOptions = options || []
    if (type === 'true_false' && finalOptions.length === 0) {
      finalOptions = [
        { optionText: 'True', isCorrect: true, orderIndex: 0 },
        { optionText: 'False', isCorrect: false, orderIndex: 1 }
      ]
    }

    const createdQuestion = await prisma.quizQuestion.create({
      data: {
        quizId,
        type: type || 'mcq',
        question,
        marks: marks ? parseFloat(marks) : 1,
        explanation: explanation || '',
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex, 10) : 0,
        options: {
          create: finalOptions.map((opt: any, idx: number) => ({
            optionText: opt.optionText,
            isCorrect: !!opt.isCorrect,
            orderIndex: opt.orderIndex !== undefined ? parseInt(opt.orderIndex, 10) : idx
          }))
        }
      },
      include: { options: true }
    })

    return NextResponse.json({ success: true, question: createdQuestion }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating question:', err)
    return NextResponse.json({ error: 'Failed to create question', details: err.message }, { status: 500 })
  }
}
