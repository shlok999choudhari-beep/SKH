import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const verifySchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const docId = parseInt(id, 10)
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const document = await prisma.document.findUnique({
      where: { id: docId }
    })

    if (
      !document ||
      document.institutionId !== user.institutionId ||
      document.accessLevel === 'PRIVATE'
    ) {
      return NextResponse.json({ error: 'Document not found or forbidden' }, { status: 404 })
    }

    const body = await request.json()
    const validated = verifySchema.parse(body)

    if (validated.status === 'REJECTED' && (!validated.rejectionReason || !validated.rejectionReason.trim())) {
      return NextResponse.json({ error: 'Rejection reason is required when rejecting a document' }, { status: 400 })
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        verificationStatus: validated.status,
        rejectionReason: validated.status === 'REJECTED' ? validated.rejectionReason : null,
        verifiedAt: new Date(),
        verifiedBy: session.userId
      }
    })

    return NextResponse.json({ success: true, document: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Verify document error:', error)
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 })
  }
}
