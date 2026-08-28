import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { issueCourseCertificate } from '@/lib/certificateService'

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

    const courseId = parseInt(resolvedParams.id, 10)
    const studentId = session.role === 'student' ? session.userId : null

    if (!studentId) {
      return NextResponse.json({ error: 'Only enrolled students have course completion records' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        trainer: { select: { user: { select: { name: true } } } },
        institution: { select: { name: true } },
        modules: {
          include: {
            lessons: true,
            assignments: { where: { status: 'published' } },
            quizzes: { where: { status: 'published' } }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId
        }
      },
      include: {
        completion: true,
        certificate: true
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this course' }, { status: 403 })
    }

    // Calculate Completion Checklist
    const totalLessons = course.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0)
    const totalAssignments = course.modules.reduce((sum: number, m: any) => sum + m.assignments.length, 0)
    const totalQuizzes = course.modules.reduce((sum: number, m: any) => sum + m.quizzes.length, 0)

    // Lessons Completed
    const completedLessonsCount = await prisma.learningProgress.count({
      where: {
        enrollmentId: enrollment.id,
        lessonId: { not: null },
        isCompleted: true
      }
    })

    // Assignments Completed (submitted or graded)
    const completedAssignmentsCount = await prisma.assignmentSubmission.count({
      where: {
        studentId,
        assignment: { courseId, status: 'published' }
      }
    })

    // Quizzes Passed
    const passedQuizzesCount = await prisma.quizAttempt.count({
      where: {
        studentId,
        quiz: { courseId, status: 'published' },
        passed: true
      }
    })

    const allLessonsDone = totalLessons === 0 || completedLessonsCount >= totalLessons
    const allAssignmentsDone = totalAssignments === 0 || completedAssignmentsCount >= totalAssignments
    const allQuizzesDone = totalQuizzes === 0 || passedQuizzesCount >= totalQuizzes

    const isEligible = allLessonsDone && allAssignmentsDone && allQuizzesDone && course.certificateEnabled

    return NextResponse.json({
      completion: {
        courseId,
        courseTitle: course.title,
        enrollmentId: enrollment.id,
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        certificateEnabled: course.certificateEnabled,
        isEligibleForCertificate: isEligible,
        checklist: {
          lessons: {
            total: totalLessons,
            completed: completedLessonsCount,
            isComplete: allLessonsDone
          },
          assignments: {
            total: totalAssignments,
            completed: completedAssignmentsCount,
            isComplete: allAssignmentsDone
          },
          quizzes: {
            total: totalQuizzes,
            completed: passedQuizzesCount,
            isComplete: allQuizzesDone
          }
        },
        issuedCertificate: enrollment.certificate || null,
        completionRecord: enrollment.completion || null
      }
    })
  } catch (err: any) {
    console.error('Error calculating course completion status:', err)
    return NextResponse.json({ error: 'Failed to calculate completion', details: err.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || session.role !== 'student' || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. Only students can claim certificates.' }, { status: 401 })
    }

    const courseId = parseInt(resolvedParams.id, 10)
    const studentId = session.userId

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        trainer: { select: { user: { select: { name: true } } } },
        institution: { select: { name: true } },
        modules: {
          include: {
            lessons: true,
            assignments: { where: { status: 'published' } },
            quizzes: { where: { status: 'published' } }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.certificateEnabled) {
      return NextResponse.json({ error: 'Certificates are not enabled for this course.' }, { status: 400 })
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId
        }
      },
      include: {
        certificate: true,
        student: { select: { name: true, email: true } }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 403 })
    }

    if (enrollment.certificate) {
      return NextResponse.json({
        success: true,
        message: 'Certificate already issued for this course',
        certificate: enrollment.certificate
      })
    }

    // Verify Requirements Server-Side
    const totalLessons = course.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0)
    const totalAssignments = course.modules.reduce((sum: number, m: any) => sum + m.assignments.length, 0)
    const totalQuizzes = course.modules.reduce((sum: number, m: any) => sum + m.quizzes.length, 0)

    const completedLessonsCount = await prisma.learningProgress.count({
      where: {
        enrollmentId: enrollment.id,
        lessonId: { not: null },
        isCompleted: true
      }
    })

    const completedAssignmentsCount = await prisma.assignmentSubmission.count({
      where: {
        studentId,
        assignment: { courseId, status: 'published' }
      }
    })

    const passedQuizzesCount = await prisma.quizAttempt.count({
      where: {
        studentId,
        quiz: { courseId, status: 'published' },
        passed: true
      }
    })

    const allLessonsDone = totalLessons === 0 || completedLessonsCount >= totalLessons
    const allAssignmentsDone = totalAssignments === 0 || completedAssignmentsCount >= totalAssignments
    const allQuizzesDone = totalQuizzes === 0 || passedQuizzesCount >= totalQuizzes

    if (!allLessonsDone || !allAssignmentsDone || !allQuizzesDone) {
      return NextResponse.json({
        error: 'Course completion requirements have not been fully met yet.',
        checklist: {
          lessons: `${completedLessonsCount}/${totalLessons}`,
          assignments: `${completedAssignmentsCount}/${totalAssignments}`,
          quizzes: `${passedQuizzesCount}/${totalQuizzes}`
        }
      }, { status: 400 })
    }

    const originUrl = req.nextUrl.origin

    // Issue Certificate
    const result = await issueCourseCertificate({
      enrollmentId: enrollment.id,
      courseId,
      studentId,
      studentName: enrollment.student.name,
      courseTitle: course.title,
      instructorName: course.trainer?.user?.name || null,
      institutionName: course.institution?.name || 'PlaceIQ Institution',
      lessonsCompleted: completedLessonsCount,
      assignmentsCompleted: completedAssignmentsCount,
      quizzesPassed: passedQuizzesCount,
      originUrl
    })

    return NextResponse.json({
      success: true,
      message: 'Certificate successfully generated and added to your Document Vault!',
      certificate: result.certificate,
      documentId: result.document.id
    }, { status: 201 })
  } catch (err: any) {
    console.error('Error claiming certificate:', err)
    return NextResponse.json({ error: 'Failed to generate certificate', details: err.message }, { status: 500 })
  }
}
