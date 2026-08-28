import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  categoryId: z.number().nullable().optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).optional(),
  estimatedDuration: z.string().optional(),
  thumbnail: z.string().optional(),
  learningObjectives: z.string().optional(),
  prerequisites: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  trainerId: z.number().nullable().optional()
})

// GET /api/courses/[id] - Get detailed course structure
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const session = await getSession()

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: {
                resources: {
                  orderBy: { orderIndex: 'asc' }
                }
              }
            },
            resources: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        assignments: {
          where: { status: 'published' },
          orderBy: { orderIndex: 'asc' },
          include: {
            submissions: session?.userId ? {
              where: { studentId: session.userId },
              include: { grade: true }
            } : false
          }
        },
        quizzes: {
          where: { status: 'published' },
          orderBy: { orderIndex: 'asc' },
          include: {
            questions: { select: { id: true, marks: true } },
            attempts: session?.userId ? {
              where: { studentId: session.userId },
              orderBy: { percentage: 'desc' }
            } : false
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        },
        // Trainer gets recent enrollment list for Share page
        enrollments: (session?.role === 'trainer' || session?.role === 'institution-admin') ? {
          orderBy: { enrolledAt: 'desc' },
          take: 20,
          include: {
            student: { select: { id: true, name: true, email: true } }
          }
        } : false
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check enrollment if student is logged in
    let enrollment: any = null
    let completedLessonIds: number[] = []
    let completedResourceIds: number[] = []

    if (session?.role === 'student') {
      enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId,
            studentId: session.userId
          }
        },
        include: {
          progress: {
            where: { isCompleted: true }
          }
        }
      })

      if (enrollment) {
        completedLessonIds = enrollment.progress
          .filter((p: any) => p.lessonId)
          .map((p: any) => p.lessonId)
        completedResourceIds = enrollment.progress
          .filter((p: any) => p.resourceId)
          .map((p: any) => p.resourceId)
      }
    }

    // Calculate total lessons and resources count
    let totalLessonsCount = 0
    let totalResourcesCount = 0

    const enrichedModules = course.modules.map((m: any) => {
      totalLessonsCount += m.lessons.length
      totalResourcesCount += (m.resources?.length || 0) + m.lessons.reduce((acc: number, l: any) => acc + (l.resources?.length || 0), 0)

      const enrichedLessons = m.lessons.map((l: any) => {
        const isLessonDone = completedLessonIds.includes(l.id)
        const enrichedResources = (l.resources || []).map((r: any) => ({
          ...r,
          isCompleted: completedResourceIds.includes(r.id)
        }))
        return {
          ...l,
          isCompleted: isLessonDone,
          resources: enrichedResources
        }
      })

      // Get assignments and quizzes belonging to this module
      const moduleAssignments = (course.assignments || []).filter((a: any) => a.moduleId === m.id)
      const moduleQuizzes = (course.quizzes || []).filter((q: any) => q.moduleId === m.id)

      const completedModuleLessons = enrichedLessons.filter((l: any) => l.isCompleted).length
      const moduleProgressPercent = enrichedLessons.length > 0 ? Math.round((completedModuleLessons / enrichedLessons.length) * 100) : 0

      return {
        ...m,
        lessons: enrichedLessons,
        assignments: moduleAssignments,
        quizzes: moduleQuizzes,
        progressPercent: moduleProgressPercent,
        isCompleted: enrichedLessons.length > 0 && completedModuleLessons === enrichedLessons.length
      }
    })

    return NextResponse.json({
      course: {
        ...course,
        modules: enrichedModules,
        totalLessonsCount,
        totalResourcesCount,
        enrolledCount: course._count?.enrollments || 0,
        isEnrolled: !!enrollment,
        enrollment: enrollment ? {
          id: enrollment.id,
          status: enrollment.status,
          progressPercent: enrollment.progressPercent,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          lastAccessedAt: enrollment.lastAccessedAt,
          lastLessonId: enrollment.lastLessonId
        } : null
      }
    })
  } catch (error: any) {
    console.error('Error fetching course details:', error)
    return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 })
  }
}

// PATCH /api/courses/[id] - Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: { trainer: true }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Authorization: Trainer can only update their own courses
    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (!trainerRecord || existingCourse.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden: You can only edit your own courses' }, { status: 403 })
      }
    }

    const body = await request.json()
    const validated = updateCourseSchema.parse(body)

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.difficulty && { difficulty: validated.difficulty }),
        ...(validated.estimatedDuration !== undefined && { estimatedDuration: validated.estimatedDuration }),
        ...(validated.thumbnail !== undefined && { thumbnail: validated.thumbnail }),
        ...(validated.learningObjectives !== undefined && { learningObjectives: validated.learningObjectives }),
        ...(validated.prerequisites !== undefined && { prerequisites: validated.prerequisites }),
        ...(validated.status && { status: validated.status }),
        ...(validated.trainerId !== undefined && session.role === 'institution-admin' && { trainerId: validated.trainerId })
      },
      include: {
        category: true,
        trainer: {
          include: { user: true }
        }
      }
    })

    return NextResponse.json({ success: true, course: updatedCourse })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (!trainerRecord || existingCourse.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden: You can only delete your own courses' }, { status: 403 })
      }
    }

    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({ success: true, message: 'Course deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
