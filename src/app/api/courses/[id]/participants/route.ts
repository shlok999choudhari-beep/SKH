import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { trainer: true }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Role verification
    const isTeacher = session.role === 'trainer' || session.role === 'institution-admin'
    if (!isTeacher) {
      // Check if student is enrolled
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: { courseId_studentId: { courseId, studentId: session.userId } }
      })
      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment required to view participants.' }, { status: 403 })
      }
    }

    const whereEnrollment: any = {
      courseId
    }

    if (status !== 'all') {
      whereEnrollment.status = status
    }

    if (search.trim()) {
      whereEnrollment.student = {
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } },
          { college: { contains: search.trim(), mode: 'insensitive' } }
        ]
      }
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: whereEnrollment,
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: isTeacher, // only full email for teacher
            college: true,
            degree: true,
            graduationYear: true,
            createdAt: true
          }
        },
        progress: {
          where: { isCompleted: true },
          select: { id: true }
        }
      }
    })

    const participants = enrollments.map((enr: any) => ({
      id: enr.id,
      studentId: enr.studentId,
      name: enr.student?.name || 'Student',
      email: isTeacher ? enr.student?.email : undefined,
      college: enr.student?.college || 'Engineering College',
      degree: enr.student?.degree,
      graduationYear: enr.student?.graduationYear,
      enrolledAt: enr.enrolledAt,
      lastAccessedAt: enr.lastAccessedAt,
      progressPercent: enr.progressPercent || 0,
      status: enr.status || 'Active',
      completedActivitiesCount: enr.progress?.length || 0
    }))

    return NextResponse.json({
      participants,
      totalCount: participants.length,
      isTeacher
    })
  } catch (err: any) {
    console.error('Error fetching course participants:', err)
    return NextResponse.json({ error: 'Failed to fetch participants', details: err.message }, { status: 500 })
  }
}

// DELETE /api/courses/[id]/participants - Remove/Unenroll student (Teacher only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized. Only instructors can manage roster.' }, { status: 403 })
    }

    const body = await req.json()
    const studentId = parseInt(body.studentId, 10)
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    await prisma.courseEnrollment.deleteMany({
      where: {
        courseId,
        studentId
      }
    })

    return NextResponse.json({ success: true, message: 'Student removed from course.' })
  } catch (err: any) {
    console.error('Error removing student:', err)
    return NextResponse.json({ error: 'Failed to remove student', details: err.message }, { status: 500 })
  }
}
