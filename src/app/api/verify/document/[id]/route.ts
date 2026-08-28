import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyStoredDocumentIntegrity } from '@/lib/documentSecurityService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 })
    }

    let doc: any = null

    // Support both numeric doc ID and publicVerificationId string
    const numericId = parseInt(id, 10)
    if (!isNaN(numericId)) {
      doc = await prisma.document.findUnique({
        where: { id: numericId },
        include: {
          student: { select: { name: true, college: true, degree: true } },
          institution: { select: { name: true, domain: true } },
          verification: { select: { status: true, verificationScore: true, riskLevel: true } }
        }
      })
    }

    if (!doc) {
      doc = await prisma.document.findFirst({
        where: { publicVerificationId: id },
        include: {
          student: { select: { name: true, college: true, degree: true } },
          institution: { select: { name: true, domain: true } },
          verification: { select: { status: true, verificationScore: true, riskLevel: true } }
        }
      })
    }

    if (!doc) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: '❌ Document record not found. This credential cannot be verified on the PlaceIQ Institutional Ledger.'
      }, { status: 404 })
    }

    // Verify storage cryptographic hash against fingerprint
    const integrityCheck = await verifyStoredDocumentIntegrity(doc.id)

    return NextResponse.json({
      success: true,
      verification: {
        documentId: doc.publicVerificationId || `PIQ-DOC-${doc.id}`,
        title: doc.fileName,
        documentType: doc.documentType,
        category: doc.category,
        issuedTo: doc.student?.name || 'Verified Student',
        college: doc.student?.college || 'Affiliated Institution',
        issuingAuthority: doc.institution?.name || 'PlaceIQ Verified Campus Network',
        issuedDate: doc.uploadedAt,
        status: doc.verificationStatus === 'REJECTED' ? 'REJECTED' : 'AUTHENTIC',
        integrityStatus: integrityCheck.verified ? 'VERIFIED_CLEAN' : 'INTEGRITY_MISMATCH',
        sha256Fingerprint: doc.sha256Hash || integrityCheck.computedHash,
        securityClassification: doc.securityLevel || 'PROTECTED',
        isAuthentic: integrityCheck.verified && doc.verificationStatus !== 'REJECTED'
      }
    })
  } catch (error: any) {
    console.error('Public QR verification error:', error)
    return NextResponse.json({ error: 'Failed to verify document authenticity' }, { status: 500 })
  }
}
