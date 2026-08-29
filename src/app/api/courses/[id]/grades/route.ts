import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const isTeacher = session.role === 'trainer' || session.role === 'institution-admin'

    // Fetch assignments and quizzes for this course
    const assignments = await prisma.assignment.findMany({
      where: { courseId, status: 'published' },
      orderBy: { orderIndex: 'asc' },
      include: {
        submissions: {
          include: { grade: true, student: { select: { id: true, name: true, email: true } } }
        }
      }
    })

    const quizzes = await prisma.quiz.findMany({
      where: { courseId, status: 'published' },
      orderBy: { orderIndex: 'asc' },
      include: {
        attempts: {
          include: { student: { select: { id: true, name: true, email: true } } },
          orderBy: { percentage: 'desc' }
        },
        questions: { select: { id: true, marks: true } }
      }
    })

    // If student: return student-specific grade report
    if (!isTeacher) {
      const studentId = session.userId

      // Check enrollment
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: { courseId_studentId: { courseId, studentId } }
      })
      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment required to view grades.' }, { status: 403 })
      }

      let totalMaxMarks = 0
      let totalEarnedMarks = 0
      let totalGradedItems = 0

      const assignmentGrades = assignments.map((a: any) => {
        const sub = a.submissions.find((s: any) => s.studentId === studentId)
        const grade = sub?.grade
        const isGraded = !!grade
        const marks = grade ? grade.marks : null
        const max = a.maxMarks || 10

        if (isGraded) {
          totalMaxMarks += max
          totalEarnedMarks += marks
          totalGradedItems++
        }

        return {
          id: a.id,
          title: a.title,
          type: 'Assignment',
          dueDate: a.dueDate,
          maxMarks: max,
          obtainedMarks: marks,
          percentage: marks !== null ? Math.round((marks / max) * 100) : null,
          status: isGraded ? 'Graded' : sub ? 'Submitted' : 'Pending',
          feedback: grade?.feedback || null,
          submittedAt: sub?.submittedAt || null,
          gradedAt: grade?.gradedAt || null
        }
      })

      const quizGrades = quizzes.map((q: any) => {
        const attempts = q.attempts.filter((att: any) => att.studentId === studentId)
        const bestAttempt = attempts[0] || null
        const totalQuizMarks = q.questions.reduce((sum: number, ques: any) => sum + (ques.marks || 1), 0) || 10
        const isTaken = !!bestAttempt
        const obtained = bestAttempt ? bestAttempt.obtainedMarks : null

        if (isTaken) {
          totalMaxMarks += totalQuizMarks
          totalEarnedMarks += obtained
          totalGradedItems++
        }

        return {
          id: q.id,
          title: q.title,
          type: 'Quiz',
          maxMarks: totalQuizMarks,
          obtainedMarks: obtained,
          percentage: bestAttempt ? Math.round(bestAttempt.percentage) : null,
          passingScore: q.passingScore,
          passed: bestAttempt ? bestAttempt.passed : false,
          attemptsCount: attempts.length,
          status: isTaken ? (bestAttempt.passed ? 'Passed' : 'Completed') : 'Not Attempted',
          submittedAt: bestAttempt?.submittedAt || null
        }
      })

      const overallPercentage = totalMaxMarks > 0 ? Math.round((totalEarnedMarks / totalMaxMarks) * 100) : enrollment.progressPercent || 0
      
      let letterGrade = 'A+'
      if (overallPercentage < 60) letterGrade = 'F'
      else if (overallPercentage < 70) letterGrade = 'C'
      else if (overallPercentage < 80) letterGrade = 'B'
      else if (overallPercentage < 90) letterGrade = 'A'

      return NextResponse.json({
        isTeacher: false,
        summary: {
          overallPercentage,
          letterGrade,
          totalEarnedMarks,
          totalMaxMarks,
          totalGradedItems,
          courseProgress: enrollment.progressPercent
        },
        items: [...assignmentGrades, ...quizGrades]
      })
    }

    // If teacher: return full gradebook matrix
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: { select: { id: true, name: true, email: true } }
      }
    })

    const columns = [
      ...assignments.map((a: any) => ({
        id: `assign_${a.id}`,
        title: a.title,
        type: 'Assignment',
        maxMarks: a.maxMarks
      })),
      ...quizzes.map((q: any) => ({
        id: `quiz_${q.id}`,
        title: q.title,
        type: 'Quiz',
        maxMarks: q.questions.reduce((sum: number, ques: any) => sum + (ques.marks || 1), 0) || 10
      }))
    ]

    const studentRows = enrollments.map((enr: any) => {
      const studentId = enr.studentId
      let studentEarned = 0
      let studentMax = 0
      const itemScores: Record<string, any> = {}

      assignments.forEach((a: any) => {
        const sub = a.submissions.find((s: any) => s.studentId === studentId)
        const grade = sub?.grade
        const max = a.maxMarks || 10
        const marks = grade ? grade.marks : null

        if (marks !== null) {
          studentEarned += marks
          studentMax += max
        }

        itemScores[`assign_${a.id}`] = {
          marks,
          max,
          status: grade ? 'Graded' : sub ? 'Submitted' : 'Missing',
          submissionId: sub?.id || null,
          submission: sub ? {
            id: sub.id,
            fileName: sub.fileName,
            fileUrl: sub.fileUrl,
            textAnswer: sub.textAnswer,
            submittedAt: sub.submittedAt,
            grade: grade ? {
              marks: grade.marks,
              feedback: grade.feedback,
              status: grade.status
            } : null
          } : null
        }
      })

      quizzes.forEach((q: any) => {
        const attempts = q.attempts.filter((att: any) => att.studentId === studentId)
        const best = attempts[0] || null
        const totalQuizMarks = q.questions.reduce((sum: number, ques: any) => sum + (ques.marks || 1), 0) || 10
        const marks = best ? best.obtainedMarks : null

        if (marks !== null) {
          studentEarned += marks
          studentMax += totalQuizMarks
        }

        itemScores[`quiz_${q.id}`] = {
          marks,
          max: totalQuizMarks,
          status: best ? (best.passed ? 'Passed' : 'Completed') : 'Not Attempted',
          percentage: best ? best.percentage : null
        }
      })

      const averagePercent = studentMax > 0 ? Math.round((studentEarned / studentMax) * 100) : enr.progressPercent || 0

      return {
        studentId,
        studentName: enr.student?.name || 'Student',
        studentEmail: enr.student?.email,
        progressPercent: enr.progressPercent,
        averagePercent,
        scores: itemScores
      }
    })

    return NextResponse.json({
      isTeacher: true,
      columns,
      studentRows,
      totalStudents: enrollments.length
    })
  } catch (err: any) {
    console.error('Error fetching course grades:', err)
    return NextResponse.json({ error: 'Failed to fetch course grades', details: err.message }, { status: 500 })
  }
}

// POST /api/courses/[id]/grades - Grade student submission (Teacher only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { submissionId, marks, feedback, status = 'accepted' } = body

    if (!submissionId || marks === undefined) {
      return NextResponse.json({ error: 'Submission ID and marks are required' }, { status: 400 })
    }

    let trainerId: number | null = null
    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({ where: { userId: session.userId } })
      if (trainer) trainerId = trainer.id
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: parseInt(submissionId, 10) }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const grade = await prisma.assignmentGrade.upsert({
      where: { submissionId: submission.id },
      create: {
        submissionId: submission.id,
        trainerId,
        marks: parseFloat(marks),
        feedback: feedback || '',
        status
      },
      update: {
        trainerId,
        marks: parseFloat(marks),
        feedback: feedback || '',
        status,
        gradedAt: new Date()
      }
    })

    await prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: { status: 'graded' }
    })

    return NextResponse.json({ success: true, grade })
  } catch (err: any) {
    console.error('Error grading submission:', err)
    return NextResponse.json({ error: 'Failed to submit grade', details: err.message }, { status: 500 })
  }
}
