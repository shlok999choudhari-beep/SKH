import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { verifyStoredDocumentIntegrity, logDocumentActivity } from '@/lib/documentSecurityService'

export async function POST(
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
        student: { select: { id: true, name: true } }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await verifyStoredDocumentIntegrity(doc.id)

    if (result.verified) {
      await logDocumentActivity({
        documentId: doc.id,
        actorId: session.userId,
        actorName: doc.student.name || 'User',
        actorRole: session.role,
        action: 'DOCUMENT_INTEGRITY_VERIFIED',
        details: `Cryptographic SHA-256 fingerprint verified clean against physical storage (${result.computedHash}).`,
        status: 'SUCCESS'
      })

      return NextResponse.json({
        success: true,
        verified: true,
        sha256Hash: result.computedHash,
        message: '✓ Document integrity verified. Storage file matches the original cryptographic fingerprint.'
      })
    } else {
      await logDocumentActivity({
        documentId: doc.id,
        actorId: session.userId,
        actorName: doc.student.name || 'User',
        actorRole: session.role,
        action: 'DOCUMENT_INTEGRITY_FAILURE',
        details: `🚨 ALERT: Storage file SHA-256 (${result.computedHash}) does NOT match registered fingerprint (${result.storedHash}).`,
        status: 'WARNING'
      })

      return NextResponse.json({
        success: false,
        verified: false,
        storedHash: result.storedHash,
        computedHash: result.computedHash,
        error: '🚨 DOCUMENT INTEGRITY ALERT: The stored file does not match the original document fingerprint. Document access is restricted.',
        alert: true
      }, { status: 409 })
    }
  } catch (error: any) {
    console.error('Verify integrity error:', error)
    return NextResponse.json({ error: 'Failed to verify document integrity' }, { status: 500 })
  }
}
