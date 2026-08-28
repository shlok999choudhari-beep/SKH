import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET /api/trainer/students - List students enrolled across trainer's courses
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

    const { searchParams } = new URL(request.url)
    const courseIdParam = searchParams.get('courseId')
    const search = searchParams.get('search') || ''

    const where: any = {}
    if (trainerId) {
      where.course = { trainerId }
    }
    if (courseIdParam) {
      const parsed = parseInt(courseIdParam, 10)
      if (!isNaN(parsed)) {
        where.courseId = parsed
      }
    }
    if (search.trim()) {
      where.student = {
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } }
        ]
      }
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
            degree: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true
          }
        },
        progress: {
          where: { isCompleted: true }
        }
      }
    })

    const mapped = enrollments.map((enr: any) => ({
      enrollmentId: enr.id,
      studentId: enr.student.id,
      studentName: enr.student.name,
      studentEmail: enr.student.email,
      studentCollege: enr.student.college || 'PlaceIQ Academy',
      studentDegree: enr.student.degree || 'Computer Science',
      courseId: enr.course.id,
      courseTitle: enr.course.title,
      courseCategory: enr.course.category?.name || 'General',
      progressPercent: enr.progressPercent,
      status: enr.status,
      enrolledAt: enr.enrolledAt,
      lastAccessedAt: enr.lastAccessedAt,
      completedAt: enr.completedAt,
      completedLessonsCount: enr.progress.length
    }))

    return NextResponse.json({ students: mapped })
  } catch (error: any) {
    console.error('Error fetching trainer students:', error)
    return NextResponse.json({ error: 'Failed to fetch enrolled students' }, { status: 500 })
  }
}
