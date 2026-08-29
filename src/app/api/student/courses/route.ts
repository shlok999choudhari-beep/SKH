import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

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
                },
                assignments: true,
                resources: true
              }
            }
          }
        },
        progress: {
          where: { isCompleted: true }
        }
      }
    })

    const mappedCourses = enrollments.map((enr: any) => {
      const course = enr.course
      const allLessons = course.modules.flatMap((m: any) => m.lessons)
      const allAssignments = course.modules.flatMap((m: any) => m.assignments || [])
      const totalLessons = allLessons.length
      const totalActivities = totalLessons + allAssignments.length

      return {
        enrollmentId: enr.id,
        courseId: course.id,
        title: course.title,
        shortName: course.shortName || '',
        academicYear: course.academicYear || 'AY 2026-27',
        semester: course.semester || 'Semester I',
        department: course.department || 'Computer Engineering',
        joinCode: course.joinCode,
        slug: course.slug,
        description: course.description,
        thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
        category: course.category?.name || 'General',
        difficulty: course.difficulty,
        estimatedDuration: course.estimatedDuration,
        trainerName: course.trainer?.user?.name || 'Prof. Rajesh Sharma',
        trainerRating: course.trainer?.rating || 4.9,
        progressPercent: enr.progressPercent || 0,
        status: enr.status, // 'active' | 'completed' | 'dropped'
        enrolledAt: enr.enrolledAt,
        completedAt: enr.completedAt,
        lastAccessedAt: enr.lastAccessedAt || enr.enrolledAt,
        totalModules: course.modules.length,
        totalLessons,
        totalActivities,
        completedLessonsCount: enr.progress.filter((p: any) => p.lessonId).length
      }
    })

    // Separate recently accessed (sorted by lastAccessedAt, max 6) and all enrolled
    const recentlyAccessed = [...mappedCourses]
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 6)

    return NextResponse.json({
      courses: mappedCourses,
      recentlyAccessed,
      totalCount: mappedCourses.length
    })
  } catch (error: any) {
    console.error('Error fetching student enrolled courses:', error)
    return NextResponse.json({ error: 'Failed to fetch enrolled courses' }, { status: 500 })
  }
}
