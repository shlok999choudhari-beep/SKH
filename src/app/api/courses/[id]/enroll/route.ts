import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/courses/[id]/enroll - Check enrollment status for current student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ isEnrolled: false })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: session.userId
        }
      },
      include: {
        progress: true
      }
    })

    if (!enrollment) {
      return NextResponse.json({ isEnrolled: false })
    }

    return NextResponse.json({
      isEnrolled: true,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        lastAccessedAt: enrollment.lastAccessedAt,
        lastLessonId: enrollment.lastLessonId
      }
    })
  } catch (error: any) {
    console.error('Error checking enrollment:', error)
    return NextResponse.json({ error: 'Failed to check enrollment' }, { status: 500 })
  }
}

// POST /api/courses/[id]/enroll - Enroll student in course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized. Please sign in as a student to enroll.' }, { status: 401 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if already enrolled
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: session.userId
        }
      }
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already enrolled in this course',
        enrollment: existing
      })
    }

    // First lesson if available to set initial lastLessonId
    const firstLessonId = course.modules[0]?.lessons[0]?.id || null

    const newEnrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        studentId: session.userId,
        status: 'active',
        progressPercent: 0,
        enrolledAt: new Date(),
        lastAccessedAt: new Date(),
        lastLessonId: firstLessonId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment: newEnrollment
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error enrolling student in course:', error)
    return NextResponse.json({ error: 'Failed to enroll in course' }, { status: 500 })
  }
}
