import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let trainerId: number | null = null
    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainer) trainerId = trainer.id
    }

    const whereAssignment: any = {}
    if (trainerId) whereAssignment.trainerId = trainerId

    const assignments = await prisma.assignment.findMany({
      where: whereAssignment,
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        submissions: {
          include: { grade: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalAssignments = assignments.length
    let totalSubmissions = 0
    let pendingSubmissions = 0
    let gradedSubmissions = 0
    let lateSubmissions = 0
    let totalMarksSum = 0
    let totalGradesCount = 0

    const formattedAssignments = assignments.map((a: any) => {
      const subs = a.submissions || []
      totalSubmissions += subs.length

      const pending = subs.filter((s: any) => s.status === 'submitted' || s.status === 'late').length
      const graded = subs.filter((s: any) => s.status === 'graded').length
      const late = subs.filter((s: any) => s.status === 'late').length

      pendingSubmissions += pending
      gradedSubmissions += graded
      lateSubmissions += late

      const grades = subs.map((s: any) => s.grade?.marks).filter((m: any) => typeof m === 'number')
      grades.forEach((m: number) => {
        totalMarksSum += (m / a.maxMarks) * 100
        totalGradesCount++
      })

      return {
        id: a.id,
        title: a.title,
        courseId: a.courseId,
        courseTitle: a.course?.title,
        moduleId: a.moduleId,
        moduleTitle: a.module?.title,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        status: a.status,
        submissionType: a.submissionType,
        totalSubmissions: subs.length,
        pendingSubmissions: pending,
        gradedSubmissions: graded,
        lateSubmissions: late
      }
    })

    const avgScore = totalGradesCount > 0
      ? Math.round(totalMarksSum / totalGradesCount)
      : 0

    return NextResponse.json({
      stats: {
        totalAssignments,
        totalSubmissions,
        pendingSubmissions,
        gradedSubmissions,
        lateSubmissions,
        avgScore
      },
      assignments: formattedAssignments
    })
  } catch (err: any) {
    console.error('Error fetching trainer assignment stats:', err)
    return NextResponse.json({ error: 'Failed to fetch assignment stats', details: err.message }, { status: 500 })
  }
}
