import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student' || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = session.userId

    // Get all enrolled courses with their assignments and quizzes
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            assignments: {
              where: { status: 'published' },
              orderBy: [{ dueDate: 'asc' }, { orderIndex: 'asc' }],
              include: {
                module: { select: { id: true, title: true } },
                trainer: { select: { id: true, name: true } },
                submissions: {
                  where: { studentId },
                  include: { grade: true }
                }
              }
            },
            quizzes: {
              where: { status: 'published' },
              include: {
                module: { select: { id: true, title: true } },
                questions: { select: { id: true, marks: true } },
                attempts: {
                  where: { studentId },
                  orderBy: { percentage: 'desc' }
                }
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })

    const allAssignments: any[] = []
    const allQuizzes: any[] = []

    // For grouped-by-course view
    const courseAssignments: Record<number, any> = {}

    enrollments.forEach(enr => {
      const course = enr.course

      const courseAssignmentsList: any[] = []

      // Format assignments
      course.assignments?.forEach((a: any) => {
        const sub = a.submissions?.[0] || null
        const now = new Date()
        let isLate = false
        if (a.dueDate && now > a.dueDate && !sub) {
          isLate = true
        }

        let status = 'not_started'
        if (sub) {
          status = sub.status // 'submitted', 'late', 'graded', 'returned'
        } else if (isLate) {
          status = 'overdue'
        }

        const assignmentData = {
          id: a.id,
          title: a.title,
          description: a.description,
          courseId: course.id,
          courseTitle: course.title,
          moduleId: a.moduleId,
          moduleTitle: a.module?.title,
          trainerName: a.trainer?.name || 'Course Instructor',
          dueDate: a.dueDate,
          maxMarks: a.maxMarks,
          allowedFileTypes: a.allowedFileTypes,
          maxFileSizeMb: a.maxFileSizeMb,
          submissionType: a.submissionType,
          status,
          score: sub?.grade ? `${sub.grade.marks} / ${a.maxMarks}` : null,
          marks: sub?.grade?.marks || null,
          feedback: sub?.grade?.feedback || null,
          submittedAt: sub?.submittedAt || null,
          studentSubmission: sub ? {
            id: sub.id,
            status: sub.status,
            textAnswer: sub.textAnswer,
            fileUrl: sub.fileUrl,
            fileName: sub.fileName,
            submittedAt: sub.submittedAt,
            grade: sub.grade
          } : null
        }

        allAssignments.push(assignmentData)
        courseAssignmentsList.push(assignmentData)
      })

      // Group by course
      if (courseAssignmentsList.length > 0 || course.quizzes?.length > 0) {
        courseAssignments[course.id] = {
          courseId: course.id,
          courseTitle: course.title,
          courseThumbnail: course.thumbnailUrl,
          enrolledAt: enr.enrolledAt,
          assignments: courseAssignmentsList,
          quizCount: course.quizzes?.length || 0
        }
      }

      // Format quizzes
      course.quizzes?.forEach((q: any) => {
        const attempts = q.attempts || []
        const attemptsUsed = attempts.length
        const canAttempt = q.maxAttempts === 0 || attemptsUsed < q.maxAttempts
        const bestAttempt = attempts[0] || null
        const hasPassed = attempts.some((att: any) => att.passed)
        const totalMarks = q.questions?.reduce((acc: number, curr: any) => acc + curr.marks, 0) || 0

        let status = 'not_started'
        if (hasPassed) {
          status = 'passed'
        } else if (attemptsUsed > 0) {
          status = canAttempt ? 'in_progress' : 'failed'
        }

        allQuizzes.push({
          id: q.id,
          title: q.title,
          courseId: course.id,
          courseTitle: course.title,
          moduleId: q.moduleId,
          moduleTitle: q.module?.title,
          timeLimit: q.timeLimit,
          maxAttempts: q.maxAttempts,
          attemptsUsed,
          canAttempt,
          passingScore: q.passingScore,
          totalMarks,
          status,
          hasPassed,
          bestPercentage: bestAttempt ? bestAttempt.percentage : null,
          bestScore: bestAttempt ? `${bestAttempt.obtainedMarks} / ${bestAttempt.totalMarks}` : null
        })
      })
    })

    return NextResponse.json({
      assignments: allAssignments,
      quizzes: allQuizzes,
      courseAssignments: Object.values(courseAssignments)  // grouped by course
    })
  } catch (err: any) {
    console.error('Error fetching student assessments:', err)
    return NextResponse.json({ error: 'Failed to fetch assessments', details: err.message }, { status: 500 })
  }
}
