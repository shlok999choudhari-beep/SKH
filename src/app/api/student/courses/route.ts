import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/student/courses - Get all courses enrolled by the current student
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized. Please sign in as a student.' }, { status: 401 })
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: session.userId },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        course: {
          include: {
            category: true,
            trainer: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            },
            modules: {
              orderBy: { orderIndex: 'asc' },
              include: {
                lessons: {
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          }
        },
        progress: {
          where: { isCompleted: true }
        }
      }
    })

    const mappedEnrollments = enrollments.map((enr: any) => {
      const course = enr.course
      const allLessons = course.modules.flatMap((m: any) => m.lessons)
      const totalLessons = allLessons.length

      // Find last accessed or current lesson
      let lastLesson = null
      let currentModule = null

      if (enr.lastLessonId) {
        lastLesson = allLessons.find((l: any) => l.id === enr.lastLessonId)
      }
      if (!lastLesson && allLessons.length > 0) {
        lastLesson = allLessons[0]
      }

      if (lastLesson) {
        currentModule = course.modules.find((m: any) =>
          m.lessons.some((l: any) => l.id === lastLesson.id)
        )
      } else if (course.modules.length > 0) {
        currentModule = course.modules[0]
      }

      return {
        enrollmentId: enr.id,
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        thumbnail: course.thumbnail || '/placeholder-course.jpg',
        category: course.category?.name || 'General',
        difficulty: course.difficulty,
        estimatedDuration: course.estimatedDuration,
        trainerName: course.trainer?.user?.name || 'PlaceIQ Faculty',
        trainerRating: course.trainer?.rating || 4.9,
        progressPercent: enr.progressPercent,
        status: enr.status, // 'active' | 'completed' | 'dropped'
        enrolledAt: enr.enrolledAt,
        completedAt: enr.completedAt,
        lastAccessedAt: enr.lastAccessedAt,
        currentModuleName: currentModule?.title || 'Module 1 — Introduction',
        lastLessonTitle: lastLesson?.title || 'Lesson 1.1',
        lastLessonId: lastLesson?.id || null,
        totalModules: course.modules.length,
        totalLessons,
        completedLessonsCount: enr.progress.filter((p: any) => p.lessonId).length
      }
    })

    return NextResponse.json({ courses: mappedEnrollments })
  } catch (error: any) {
    console.error('Error fetching student enrolled courses:', error)
    return NextResponse.json({ error: 'Failed to fetch enrolled courses' }, { status: 500 })
  }
}
