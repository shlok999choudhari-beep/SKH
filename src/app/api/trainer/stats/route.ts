import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/trainer/stats - Trainer LMS dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let trainerId: number | null = null

    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainer) {
        trainerId = trainer.id
      }
    }

    // Build filter
    const courseWhere: any = trainerId ? { trainerId } : {}

    const [courses, allEnrollments] = await Promise.all([
      prisma.course.findMany({
        where: courseWhere,
        include: {
          category: true,
          _count: {
            select: {
              modules: true,
              enrollments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.courseEnrollment.findMany({
        where: trainerId ? { course: { trainerId } } : {},
        select: {
          id: true,
          status: true,
          progressPercent: true
        }
      })
    ])

    const totalCourses = courses.length
    const publishedCourses = courses.filter((c: any) => c.status === 'published').length
    const draftCourses = courses.filter((c: any) => c.status === 'draft').length
    const totalEnrolledStudents = allEnrollments.length

    const avgCompletionRate = totalEnrolledStudents > 0
      ? Math.round(allEnrollments.reduce((acc: number, e: any) => acc + e.progressPercent, 0) / totalEnrolledStudents)
      : 0

    return NextResponse.json({
      stats: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalEnrolledStudents,
        avgCompletionRate
      },
      recentCourses: courses.slice(0, 5).map((c: any) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        category: c.category?.name || 'General',
        difficulty: c.difficulty,
        modulesCount: c._count.modules,
        enrolledCount: c._count.enrollments,
        createdAt: c.createdAt
      }))
    })
  } catch (error: any) {
    console.error('Error fetching trainer stats:', error)
    return NextResponse.json({ error: 'Failed to fetch trainer statistics' }, { status: 500 })
  }
}
