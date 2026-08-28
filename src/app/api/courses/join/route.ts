import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student' || !session.userId) {
      return NextResponse.json({ error: 'Student login required' }, { status: 401 })
    }

    const body = await req.json()
    const code = (body.code || '').toString().trim().toUpperCase()

    if (!code || code.length < 4) {
      return NextResponse.json({ error: 'Please enter a valid join code.' }, { status: 400 })
    }

    // Find course by join code
    const course = await prisma.course.findFirst({
      where: {
        joinCode: code,
        joinCodeEnabled: true,
        status: 'published'
      },
      include: {
        trainer: {
          include: {
            user: { select: { name: true } }
          }
        },
        _count: { select: { enrollments: true } }
      }
    })

    if (!course) {
      return NextResponse.json({
        error: 'Invalid or expired code. Check the code and try again.'
      }, { status: 404 })
    }

    const studentId = session.userId

    // Check already enrolled
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: { courseId: course.id, studentId }
      }
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyEnrolled: true,
        course: {
          id: course.id,
          title: course.title,
          trainerName: course.trainer?.user?.name || 'Instructor'
        }
      })
    }

    // Enroll student
    await prisma.courseEnrollment.create({
      data: {
        courseId: course.id,
        studentId,
        status: 'active',
        progressPercent: 0,
        enrolledAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      alreadyEnrolled: false,
      course: {
        id: course.id,
        title: course.title,
        trainerName: course.trainer?.user?.name || 'Instructor',
        totalEnrolled: (course._count.enrollments || 0) + 1
      }
    })
  } catch (err: any) {
    console.error('Course join error:', err)
    return NextResponse.json({ error: 'Failed to join course.', details: err.message }, { status: 500 })
  }
}
