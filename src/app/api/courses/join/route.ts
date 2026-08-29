import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student' || !session.userId) {
      return NextResponse.json({ error: 'Student login required to join a course.' }, { status: 401 })
    }

    const body = await req.json()
    const rawCode = (body.code || '').toString().trim()
    const action = body.action || 'join' // 'preview' | 'join'

    if (!rawCode || rawCode.length < 3) {
      return NextResponse.json({ error: 'Please enter a valid course code.' }, { status: 400 })
    }

    // Clean code: remove spaces and hyphens for flexible matching, but also check exact & formatted
    const cleanUpper = rawCode.toUpperCase().replace(/\s+/g, '')
    const withHyphen = cleanUpper.includes('-') ? cleanUpper : cleanUpper.length >= 4 ? `${cleanUpper.slice(0, cleanUpper.length - 6)}-${cleanUpper.slice(-6)}` : cleanUpper

    // Find course by join code (case-insensitive & handles formatted/unformatted)
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { joinCode: { equals: cleanUpper, mode: 'insensitive' } },
          { joinCode: { equals: withHyphen, mode: 'insensitive' } },
          { joinCode: { equals: rawCode.toUpperCase(), mode: 'insensitive' } }
        ],
        status: 'published'
      },
      include: {
        trainer: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        category: true,
        _count: { select: { enrollments: true, modules: true } }
      }
    })

    if (!course) {
      return NextResponse.json({
        error: 'Invalid course code. Check the code and try again.'
      }, { status: 404 })
    }

    const studentId = session.userId

    // Check if already enrolled
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: { courseId: course.id, studentId }
      }
    })

    const coursePreview = {
      id: course.id,
      title: course.title,
      shortName: course.shortName || '',
      description: course.description || '',
      academicYear: course.academicYear || 'AY 2026-27',
      semester: course.semester || 'Semester I',
      department: course.department || 'Computer Engineering',
      thumbnail: course.thumbnail || '/placeholder-course.jpg',
      difficulty: course.difficulty,
      estimatedDuration: course.estimatedDuration,
      trainerName: course.trainer?.user?.name || 'PlaceIQ Instructor',
      totalEnrolled: course._count.enrollments || 0,
      totalModules: course._count.modules || 0,
      joinCode: course.joinCode
    }

    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        isEnrolled: !!existing,
        course: coursePreview
      })
    }

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyEnrolled: true,
        message: `You are already enrolled in ${course.title}.`,
        course: coursePreview
      })
    }

    // Enroll student
    await prisma.courseEnrollment.create({
      data: {
        courseId: course.id,
        studentId,
        status: 'active',
        progressPercent: 0,
        enrolledAt: new Date(),
        lastAccessedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      alreadyEnrolled: false,
      message: `Successfully joined ${course.title}!`,
      course: {
        ...coursePreview,
        totalEnrolled: (course._count.enrollments || 0) + 1
      }
    })
  } catch (err: any) {
    console.error('Course join error:', err)
    return NextResponse.json({ error: 'Failed to join course.', details: err.message }, { status: 500 })
  }
}
