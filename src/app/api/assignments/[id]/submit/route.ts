import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { uploadToSupabaseStorage, BUCKETS } from '@/lib/supabaseStorage'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || session.role !== 'student' || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized. Only students can submit assignments.' }, { status: 401 })
    }

    const assignmentId = parseInt(resolvedParams.id, 10)
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: assignment.courseId,
          studentId: session.userId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'You must be enrolled in this course to submit assignments.' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const textAnswer = formData.get('textAnswer') as string | null

    let fileUrl: string | null = null
    let fileName: string | null = null
    let fileSize: number | null = null

    if (file && file.size > 0) {
      const maxSizeBytes = (assignment.maxFileSizeMb || 10) * 1024 * 1024
      if (file.size > maxSizeBytes) {
        return NextResponse.json({
          error: `File size exceeds the allowed limit of ${assignment.maxFileSizeMb}MB.`
        }, { status: 400 })
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const allowedExts = (assignment.allowedFileTypes || 'pdf,zip,docx,png')
        .split(',')
        .map(t => t.trim().toLowerCase().replace('.', ''))

      if (allowedExts.length > 0 && !allowedExts.includes(ext) && !allowedExts.includes('*')) {
        return NextResponse.json({
          error: `File format .${ext} is not allowed. Supported formats: ${assignment.allowedFileTypes}`
        }, { status: 400 })
      }

      const fileBytes = await file.arrayBuffer()
      const storagePath = `courses/${assignment.courseId}/assignments/${assignmentId}/student_${session.userId}/${Date.now()}_${file.name}`

      const uploadRes = await uploadToSupabaseStorage(
        BUCKETS.ASSIGNMENTS,
        storagePath,
        fileBytes,
        file.type || 'application/octet-stream'
      )

      if (!uploadRes.success) {
        return NextResponse.json({ error: 'Failed to upload assignment file to storage' }, { status: 500 })
      }

      fileUrl = uploadRes.path || storagePath
      fileName = file.name
      fileSize = file.size
    }

    const now = new Date()
    const isLate = assignment.dueDate ? now > assignment.dueDate : false
    const submissionStatus = isLate ? 'late' : 'submitted'

    // Upsert Submission
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.userId
        }
      },
      create: {
        assignmentId,
        studentId: session.userId,
        fileUrl,
        fileName,
        fileSize,
        textAnswer: textAnswer || null,
        status: submissionStatus,
        submittedAt: now
      },
      update: {
        ...(fileUrl ? { fileUrl, fileName, fileSize } : {}),
        ...(textAnswer !== null ? { textAnswer } : {}),
        status: submissionStatus,
        submittedAt: now
      }
    })

    // Upsert student learning progress
    await prisma.learningProgress.upsert({
      where: {
        enrollmentId_lessonId_resourceId_assignmentId_quizId: {
          enrollmentId: enrollment.id,
          lessonId: null as any,
          resourceId: null as any,
          assignmentId: assignmentId,
          quizId: null as any
        }
      },
      create: {
        enrollmentId: enrollment.id,
        studentId: session.userId,
        assignmentId: assignmentId,
        isCompleted: true,
        completedAt: now
      },
      update: {
        isCompleted: true,
        completedAt: now
      }
    })

    // Recalculate Course progress %
    const totalLessons = await prisma.courseLesson.count({
      where: { module: { courseId: assignment.courseId } }
    })
    const totalAssignments = await prisma.assignment.count({
      where: { courseId: assignment.courseId, status: 'published' }
    })
    const totalQuizzes = await prisma.quiz.count({
      where: { courseId: assignment.courseId, status: 'published' }
    })
    const totalItems = (totalLessons || 0) + (totalAssignments || 0) + (totalQuizzes || 0)

    const completedProgressCount = await prisma.learningProgress.count({
      where: {
        enrollmentId: enrollment.id,
        isCompleted: true
      }
    })

    const newProgressPercent = totalItems > 0
      ? Math.min(100, Math.round((completedProgressCount / totalItems) * 100))
      : 0

    await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent: newProgressPercent,
        status: newProgressPercent === 100 ? 'completed' : 'active',
        completedAt: newProgressPercent === 100 ? now : null,
        lastAccessedAt: now
      }
    })

    return NextResponse.json({
      success: true,
      submission,
      isLate,
      courseProgressPercent: newProgressPercent
    })
  } catch (err: any) {
    console.error('Error submitting assignment:', err)
    return NextResponse.json({ error: 'Failed to submit assignment', details: err.message }, { status: 500 })
  }
}
