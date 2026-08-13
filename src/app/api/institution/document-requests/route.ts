import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const createRequestSchema = z.object({
  studentId: z.number({ message: 'Student selection is required' }),
  title: z.string().min(2, 'Document title is required'),
  reason: z.string().min(2, 'Reason is required'),
  category: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { institutionId: true }
    })

    if (!user || !user.institutionId) {
      return NextResponse.json({ error: 'Institution profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createRequestSchema.parse(body)

    // Verify student belongs to this institution
    const targetStudent = await prisma.student.findUnique({
      where: { id: validated.studentId },
      select: { id: true, institutionId: true }
    })

    if (!targetStudent || targetStudent.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Selected student does not belong to your institution' }, { status: 403 })
    }

    const newRequest = await prisma.documentRequest.create({
      data: {
        institutionId: user.institutionId,
        studentId: validated.studentId,
        title: validated.title,
        reason: validated.reason,
        category: validated.category || 'Academic',
        status: 'PENDING'
      }
    })

    return NextResponse.json({ success: true, request: newRequest })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Create document request error:', error)
    return NextResponse.json({ error: 'Failed to create document request' }, { status: 500 })
  }
}
