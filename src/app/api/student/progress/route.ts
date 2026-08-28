import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/student/progress - Get comprehensive student learning progress analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: session.userId },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        course: {
          include: {
            category: true,
            trainer: {
              include: { user: { select: { name: true } } }
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

    const totalEnrolled = enrollments.length
    const completedCourses = enrollments.filter((e: any) => e.progressPercent === 100 || e.status === 'completed').length
    const inProgressCourses = enrollments.filter((e: any) => e.progressPercent > 0 && e.progressPercent < 100).length
    const notStartedCourses = enrollments.filter((e: any) => e.progressPercent === 0).length

    const overallAverageProgress = totalEnrolled > 0
      ? Math.round(enrollments.reduce((sum: number, e: any) => sum + e.progressPercent, 0) / totalEnrolled)
      : 0

    const courseBreakdowns = enrollments.map((enr: any) => {
      const course = enr.course
      const completedLessonIds = enr.progress.filter((p: any) => p.lessonId).map((p: any) => p.lessonId)

      // Module breakdown
      let cumulativeCompleted = true
      const moduleStats = course.modules.map((mod: any, index: number) => {
        const modLessonIds = mod.lessons.map((l: any) => l.id)
        const modCompletedCount = modLessonIds.filter((id: number) => completedLessonIds.includes(id)).length
        const totalModLessons = modLessonIds.length
        const modPercent = totalModLessons > 0 ? Math.round((modCompletedCount / totalModLessons) * 100) : 100

        let status = 'Not Started'
        if (modPercent === 100) {
          status = 'Complete'
        } else if (modPercent > 0) {
          status = `${modPercent}% In Progress`
        } else if (!cumulativeCompleted && index > 0) {
          status = 'Upcoming'
        }

        if (modPercent < 100) {
          cumulativeCompleted = false
        }

        return {
          id: mod.id,
          title: mod.title,
          orderIndex: mod.orderIndex,
          totalLessons: totalModLessons,
          completedLessons: modCompletedCount,
          progressPercent: modPercent,
          status
        }
      })

      return {
        courseId: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        trainerName: course.trainer?.user?.name || 'PlaceIQ Faculty',
        category: course.category?.name,
        difficulty: course.difficulty,
        overallProgress: enr.progressPercent,
        status: enr.status,
        lastAccessedAt: enr.lastAccessedAt,
        modules: moduleStats
      }
    })

    return NextResponse.json({
      summary: {
        totalEnrolled,
        completedCourses,
        inProgressCourses,
        notStartedCourses,
        overallAverageProgress,
        totalCompletedLessons: enrollments.reduce((sum: number, e: any) => sum + e.progress.length, 0)
      },
      courses: courseBreakdowns
    })
  } catch (error: any) {
    console.error('Error fetching student progress analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch student progress' }, { status: 500 })
  }
}
