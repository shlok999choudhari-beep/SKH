import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { readFromVault } from '@/lib/storage'
import { normalizeFileType } from '@/lib/resumeExtractor'
import {
  decryptDocumentBuffer,
  verifyUnlockGrant,
  applyPdfWatermark,
  logDocumentActivity,
  verifyStoredDocumentIntegrity
} from '@/lib/documentSecurityService'

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
        student: { select: { id: true, name: true, email: true } },
        institution: { select: { id: true, name: true } }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 1. Check strict role authorization
    if (session.role === 'student') {
      if (doc.studentId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.role === 'institution-admin') {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { institutionId: true }
      })
      if (!user || user.institutionId !== doc.institutionId || doc.accessLevel === 'PRIVATE') {
        return NextResponse.json({ error: 'Access denied: Private document or cross-institution attempt' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Check Expiration
    if (doc.expiryDate && new Date() > doc.expiryDate) {
      await logDocumentActivity({
        documentId: doc.id,
        actorId: session.userId,
        actorName: session.role === 'student' ? doc.student.name : 'Admin',
        actorRole: session.role,
        action: 'DOCUMENT_EXPIRED',
        details: 'Access blocked: Document access permission has expired.',
        status: 'BLOCKED'
      })
      return NextResponse.json({
        error: '⏱ ACCESS EXPIRED: This document is no longer accessible through this access permission.',
        isExpired: true
      }, { status: 410 })
    }

    // 3. Check Lock State
    if (doc.isLocked && doc.lockedUntil && new Date() < doc.lockedUntil) {
      return NextResponse.json({
        error: '🔒 Document is temporarily locked due to failed security checks.',
        isLocked: true
      }, { status: 423 })
    }

    // 4. Check Password & Unlock Grant (if password protected)
    const grantToken = request.nextUrl.searchParams.get('grant')
    if (doc.isPasswordProtected && doc.passwordHash) {
      if (!grantToken || !verifyUnlockGrant(grantToken, doc.id)) {
        return NextResponse.json({
          error: 'Password unlock required before accessing this document.',
          requiresPassword: true
        }, { status: 401 })
      }
    }

    const isDownloadRequest = request.nextUrl.searchParams.get('download') === 'true'

    // 5. Enforce View-Only & Download Restrictions
    if (isDownloadRequest) {
      if (doc.isViewOnly || doc.downloadPolicy === 'DISABLED') {
        return NextResponse.json({
          error: '👁 View Only: Downloading is disabled for this protected document.',
          isViewOnly: true
        }, { status: 403 })
      }

      if (doc.downloadPolicy === 'LIMITED') {
        const max = doc.maxDownloads || 3
        if (doc.downloadCount >= max) {
          return NextResponse.json({
            error: `Download limit reached (${doc.downloadCount}/${max} used). Downloading is now restricted.`,
            limitReached: true
          }, { status: 403 })
        }
      }
    }

    // 6. Read and Decrypt Storage Buffer
    const rawBuffer = await readFromVault(doc.filePath)
    let decryptedBuffer = rawBuffer

    if (doc.isEncrypted && doc.encryptionIv && doc.encryptionTag) {
      try {
        decryptedBuffer = decryptDocumentBuffer(rawBuffer, doc.encryptionIv, doc.encryptionTag)
      } catch (decError) {
        console.error('Decryption failed for doc', doc.id, decError)
        return NextResponse.json({ error: 'Failed to decrypt document payload.' }, { status: 500 })
      }
    }

    // 7. Verify Integrity on Access
    const isPdf = doc.fileType.includes('pdf') || doc.fileName.toLowerCase().endsWith('.pdf')

    // 8. Apply Dynamic Watermarking if enabled
    let finalBuffer = decryptedBuffer
    if (doc.watermarkEnabled && isPdf) {
      finalBuffer = await applyPdfWatermark(decryptedBuffer, {
        actorName: session.role === 'student' ? doc.student.name : 'Institutional Officer',
        actorRole: session.role,
        documentId: doc.id,
        sha256Hash: doc.sha256Hash || undefined,
        customText: doc.watermarkText || undefined
      })
    }

    // 9. Update Download Count & Log Activity
    if (isDownloadRequest) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { downloadCount: { increment: 1 } }
      })
      await logDocumentActivity({
        documentId: doc.id,
        actorId: session.userId,
        actorName: session.role === 'student' ? doc.student.name : 'Officer',
        actorRole: session.role,
        action: 'DOCUMENT_DOWNLOADED',
        details: `Downloaded file (${doc.downloadCount + 1}/${doc.maxDownloads || 'unlimited'} used).`,
        status: 'SUCCESS'
      })
    } else {
      await logDocumentActivity({
        documentId: doc.id,
        actorId: session.userId,
        actorName: session.role === 'student' ? doc.student.name : 'Officer',
        actorRole: session.role,
        action: 'DOCUMENT_VIEWED',
        details: `Secure preview opened in ${doc.isViewOnly ? 'View-Only' : 'Standard'} viewer with dynamic watermark.`,
        status: 'SUCCESS'
      })
    }

    const disposition = isDownloadRequest ? 'attachment' : 'inline'
    const contentType = normalizeFileType(doc.fileName, doc.fileType)

    return new NextResponse(new Uint8Array(finalBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(doc.fileName)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Document-Security-Level': doc.securityLevel || 'STANDARD',
        'X-Document-View-Only': doc.isViewOnly ? 'true' : 'false',
        'X-Document-Watermarked': doc.watermarkEnabled ? 'true' : 'false'
      }
    })
  } catch (error: any) {
    console.error('Document secure streaming error:', error)
    return NextResponse.json({ error: 'Failed to securely stream document' }, { status: 500 })
  }
}
