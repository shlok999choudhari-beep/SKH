import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.toLowerCase() || ''

    const where: any = {}
    if (status) where.status = status

    if (session.role === 'student') {
      where.studentId = session.userId
    } else if (session.role === 'trainer') {
      const trainer = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainer) {
        where.course = { trainerId: trainer.id }
      }
      if (courseId) where.courseId = parseInt(courseId, 10)
    } else if (session.role === 'institution-admin') {
      if (courseId) where.courseId = parseInt(courseId, 10)
      if (studentId) where.studentId = parseInt(studentId, 10)
    }

    if (search) {
      where.OR = [
        { certificateId: { contains: search, mode: 'insensitive' } },
        { studentName: { contains: search, mode: 'insensitive' } },
        { courseTitle: { contains: search, mode: 'insensitive' } }
      ]
    }

    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        student: { select: { id: true, name: true, email: true, college: true } },
        document: { select: { id: true, fileName: true, filePath: true, sha256Hash: true } }
      }
    })

    return NextResponse.json({ certificates })
  } catch (err: any) {
    console.error('Error fetching certificates:', err)
    return NextResponse.json({ error: 'Failed to fetch certificates', details: err.message }, { status: 500 })
  }
}
