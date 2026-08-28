import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const progressSchema = z.object({
  lessonId: z.number().optional(),
  resourceId: z.number().optional(),
  isCompleted: z.boolean().default(true)
})

// POST /api/courses/[id]/progress - Update learning progress for a lesson or resource
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const body = await request.json()
    const { lessonId, resourceId, isCompleted } = progressSchema.parse(body)

    if (!lessonId && !resourceId) {
      return NextResponse.json({ error: 'Either lessonId or resourceId must be provided' }, { status: 400 })
    }

    // Ensure student is enrolled
    let enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: session.userId
        }
      }
    })

    if (!enrollment) {
      // Auto-enroll if not yet enrolled
      enrollment = await prisma.courseEnrollment.create({
        data: {
          courseId,
          studentId: session.userId,
          status: 'active',
          progressPercent: 0,
          enrolledAt: new Date(),
          lastAccessedAt: new Date(),
          lastLessonId: lessonId || null
        }
      })
    }

    // Upsert the specific progress entry
    const existingProgress = await prisma.learningProgress.findFirst({
      where: {
        enrollmentId: enrollment.id,
        ...(lessonId ? { lessonId } : { lessonId: null }),
        ...(resourceId ? { resourceId } : { resourceId: null })
      }
    })

    if (existingProgress) {
      await prisma.learningProgress.update({
        where: { id: existingProgress.id },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          updatedAt: new Date()
        }
      })
    } else {
      await prisma.learningProgress.create({
        data: {
          enrollmentId: enrollment.id,
          studentId: session.userId,
          lessonId: lessonId || null,
          resourceId: resourceId || null,
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      })
    }

    // Calculate total lessons in course
    const courseWithModules = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    const allLessons = courseWithModules?.modules.flatMap((m: any) => m.lessons) || []
    const totalLessons = allLessons.length

    // Count completed lessons for this enrollment
    const completedProgress = await prisma.learningProgress.findMany({
      where: {
        enrollmentId: enrollment.id,
        isCompleted: true,
        lessonId: { not: null }
      }
    })

    const completedLessonCount = completedProgress.length
    const calculatedPercent = totalLessons > 0 ? Math.min(100, Math.round((completedLessonCount / totalLessons) * 100)) : 0
    const isNowCompleted = calculatedPercent === 100

    const updatedEnrollment = await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent: calculatedPercent,
        status: isNowCompleted ? 'completed' : 'active',
        completedAt: isNowCompleted ? (enrollment.completedAt || new Date()) : null,
        lastAccessedAt: new Date(),
        ...(lessonId ? { lastLessonId: lessonId } : {})
      }
    })

    return NextResponse.json({
      success: true,
      progressPercent: updatedEnrollment.progressPercent,
      isCourseCompleted: isNowCompleted,
      status: updatedEnrollment.status,
      lastAccessedAt: updatedEnrollment.lastAccessedAt
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error updating progress:', error)
    return NextResponse.json({ error: 'Failed to update learning progress' }, { status: 500 })
  }
}
