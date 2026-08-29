import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const moduleId = searchParams.get('moduleId')
    const status = searchParams.get('status')

    const where: any = {}
    if (courseId) where.courseId = parseInt(courseId, 10)
    if (moduleId) where.moduleId = parseInt(moduleId, 10)

    // Role checks
    if (!session || session.role === 'student') {
      where.status = 'published'
    } else if (status && status !== 'all') {
      where.status = status
    }

    const assignments = await prisma.assignment.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        course: {
          select: { id: true, title: true, slug: true, category: { select: { name: true } } }
        },
        module: {
          select: { id: true, title: true }
        },
        submissions: session?.role === 'student' && session?.userId ? {
          where: { studentId: session.userId },
          include: { grade: true }
        } : {
          select: { id: true, status: true, submittedAt: true }
        }
      }
    })

    const formatted = assignments.map((a: any) => {
      const studentSub = session?.role === 'student' && a.submissions?.[0] ? a.submissions[0] : null
      const totalSubmissions = a.submissions?.length || 0
      const gradedCount = a.submissions?.filter((s: any) => s.status === 'graded').length || 0

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        courseId: a.courseId,
        courseTitle: a.course?.title,
        courseCategory: a.course?.category?.name,
        moduleId: a.moduleId,
        moduleTitle: a.module?.title,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        allowedFileTypes: a.allowedFileTypes,
        maxFileSizeMb: a.maxFileSizeMb,
        submissionType: a.submissionType,
        status: a.status,
        orderIndex: a.orderIndex,
        createdAt: a.createdAt,
        totalSubmissions,
        gradedCount,
        studentSubmission: studentSub ? {
          id: studentSub.id,
          status: studentSub.status,
          submittedAt: studentSub.submittedAt,
          grade: studentSub.grade ? {
            marks: studentSub.grade.marks,
            feedback: studentSub.grade.feedback,
            status: studentSub.grade.status
          } : null
        } : null
      }
    })

    return NextResponse.json({ assignments: formatted })
  } catch (err: any) {
    console.error('Error fetching assignments:', err)
    return NextResponse.json({ error: 'Failed to fetch assignments', details: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      courseId,
      moduleId,
      title,
      description,
      dueDate,
      maxMarks,
      allowedFileTypes,
      maxFileSizeMb,
      submissionType,
      status
    } = body

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Course and title are required' }, { status: 400 })
    }

    // Find trainer profile if applicable
    let trainerId: number | null = null
    if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainer) trainerId = trainer.id
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId: parseInt(courseId, 10),
        moduleId: moduleId ? parseInt(moduleId, 10) : null,
        trainerId,
        title,
        description: description || '',
        openedAt: body.openedAt ? new Date(body.openedAt) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        maxMarks: maxMarks ? parseFloat(maxMarks) : 100,
        allowedFileTypes: allowedFileTypes || 'pdf,zip,docx,png',
        maxFileSizeMb: maxFileSizeMb ? parseInt(maxFileSizeMb, 10) : 10,
        submissionType: submissionType || 'file_upload',
        status: status || 'draft'
      }
    })

    return NextResponse.json({ success: true, assignment }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating assignment:', err)
    return NextResponse.json({ error: 'Failed to create assignment', details: err.message }, { status: 500 })
  }
}
