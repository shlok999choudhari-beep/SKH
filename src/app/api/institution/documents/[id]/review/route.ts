import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_REUPLOAD', 'MARK_SUSPICIOUS']),
  reason: z.string().optional(),
  notes: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized: Institution Admin access required' }, { status: 401 })
    }

    const { id } = await params
    const docId = parseInt(id, 10)
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const body = await request.json()
    const validated = reviewSchema.parse(body)

    const doc = await prisma.document.findUnique({
      where: { id: docId }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if ((validated.action === 'REJECT' || validated.action === 'MARK_SUSPICIOUS') && !validated.reason?.trim()) {
      return NextResponse.json({ error: 'A justification reason is required for manual rejection or suspicious marking.' }, { status: 400 })
    }

    let newStatus = doc.verificationStatus
    let auditReason = validated.reason || validated.notes || `Admin action: ${validated.action}`

    if (validated.action === 'APPROVE') {
      newStatus = 'VERIFIED'
      auditReason = validated.notes || 'Manually approved by institution administrator.'
    } else if (validated.action === 'REJECT') {
      newStatus = 'REJECTED'
    } else if (validated.action === 'REQUEST_REUPLOAD') {
      newStatus = 'UNDER_REVIEW'
      auditReason = `Re-upload requested: ${validated.reason}`
    } else if (validated.action === 'MARK_SUSPICIOUS') {
      newStatus = 'SUSPICIOUS'
    }

    // 1. Update Document master status
    const updatedDoc = await prisma.document.update({
      where: { id: docId },
      data: {
        verificationStatus: newStatus,
        verifiedAt: newStatus === 'VERIFIED' ? new Date() : null,
        verifiedBy: session.userId,
        rejectionReason: (newStatus === 'REJECTED' || newStatus === 'SUSPICIOUS') ? auditReason : null
      }
    })

    // 2. Update DocumentVerification
    await prisma.documentVerification.updateMany({
      where: { documentId: docId },
      data: {
        status: newStatus
      }
    })

    // 3. Log into VerificationHistory with reviewer ID and timestamp
    await prisma.verificationHistory.create({
      data: {
        documentId: docId,
        changedByUserId: session.userId,
        oldStatus: doc.verificationStatus,
        newStatus,
        score: doc.verificationScore,
        reason: auditReason
      }
    })

    // 4. Log into VerificationStage Timeline
    await prisma.verificationStage.create({
      data: {
        documentId: docId,
        stageName: 'HUMAN_REVIEW',
        status: 'COMPLETED',
        details: `Admin (${session.name || 'Staff'}) performed ${validated.action}: ${auditReason}`
      }
    })

    return NextResponse.json({
      success: true,
      documentId: docId,
      newStatus,
      message: `Document successfully updated to ${newStatus}`
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Human review error:', error)
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 })
  }
}
