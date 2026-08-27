import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const docId = parseInt(id, 10)
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        verification: true,
        history: {
          orderBy: { changedAt: 'desc' }
        }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const v = doc.verification
    return NextResponse.json({
      success: true,
      documentId: doc.id,
      fileName: doc.fileName,
      verificationStatus: doc.verificationStatus,
      verificationScore: doc.verificationScore ?? 0,
      riskScore: doc.riskScore ?? 0,
      breakdown: v ? {
        ocrScore: v.ocrScore,
        fieldScore: v.fieldScore,
        qualityScore: v.qualityScore,
        qrScore: v.qrScore,
        duplicateScore: v.duplicateScore,
        reasons: v.reasons ? JSON.parse(v.reasons) : [],
        warnings: v.warnings ? JSON.parse(v.warnings) : [],
        explanation: v.explanation
      } : null,
      history: doc.history
    })
  } catch (error: any) {
    console.error('Fetch document verification error:', error)
    return NextResponse.json({ error: 'Failed to fetch verification results' }, { status: 500 })
  }
}
