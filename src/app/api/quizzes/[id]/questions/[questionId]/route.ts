import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const questionId = parseInt(resolvedParams.questionId, 10)
    const body = await req.json()
    const { type, question, marks, explanation, orderIndex, options } = body

    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (question !== undefined) updateData.question = question
    if (marks !== undefined) updateData.marks = parseFloat(marks)
    if (explanation !== undefined) updateData.explanation = explanation
    if (orderIndex !== undefined) updateData.orderIndex = parseInt(orderIndex, 10)

    await prisma.quizQuestion.update({
      where: { id: questionId },
      data: updateData
    })

    if (Array.isArray(options)) {
      await prisma.quizOption.deleteMany({
        where: { questionId }
      })

      await prisma.quizOption.createMany({
        data: options.map((opt: any, idx: number) => ({
          questionId,
          optionText: opt.optionText,
          isCorrect: !!opt.isCorrect,
          orderIndex: opt.orderIndex !== undefined ? parseInt(opt.orderIndex, 10) : idx
        }))
      })
    }

    const updated = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      include: { options: true }
    })

    return NextResponse.json({ success: true, question: updated })
  } catch (err: any) {
    console.error('Error updating question:', err)
    return NextResponse.json({ error: 'Failed to update question', details: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const questionId = parseInt(resolvedParams.questionId, 10)
    await prisma.quizQuestion.delete({
      where: { id: questionId }
    })

    return NextResponse.json({ success: true, message: 'Question deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting question:', err)
    return NextResponse.json({ error: 'Failed to delete question', details: err.message }, { status: 500 })
  }
}
