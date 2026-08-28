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

    const assignmentId = parseInt(resolvedParams.id, 10)
    const body = await req.json()
    const { submissionId, marks, feedback, status } = body

    if (!submissionId || marks === undefined) {
      return NextResponse.json({ error: 'Submission ID and marks are required' }, { status: 400 })
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: parseInt(submissionId, 10) },
      include: { assignment: true }
    })

    if (!submission || submission.assignmentId !== assignmentId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const numericMarks = parseFloat(marks)
    if (numericMarks < 0 || numericMarks > submission.assignment.maxMarks) {
      return NextResponse.json({
        error: `Marks must be between 0 and ${submission.assignment.maxMarks}`
      }, { status: 400 })
    }

    let trainerId: number | null = null
    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainer) trainerId = trainer.id
    }

    const gradeStatus = status || 'accepted'

    // Upsert Grade
    const grade = await prisma.assignmentGrade.upsert({
      where: { submissionId: submission.id },
      create: {
        submissionId: submission.id,
        trainerId,
        marks: numericMarks,
        feedback: feedback || '',
        status: gradeStatus,
        gradedAt: new Date()
      },
      update: {
        trainerId,
        marks: numericMarks,
        feedback: feedback || '',
        status: gradeStatus,
        gradedAt: new Date()
      }
    })

    // Update submission status
    const submissionStatus = gradeStatus === 'returned_for_revision' ? 'returned' : 'graded'
    await prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: { status: submissionStatus }
    })

    return NextResponse.json({
      success: true,
      grade,
      submissionStatus
    })
  } catch (err: any) {
    console.error('Error grading assignment:', err)
    return NextResponse.json({ error: 'Failed to grade assignment', details: err.message }, { status: 500 })
  }
}
