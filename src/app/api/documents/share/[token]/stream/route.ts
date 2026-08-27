import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFromVault } from '@/lib/storage'
import { normalizeFileType } from '@/lib/resumeExtractor'
import {
  decryptDocumentBuffer,
  verifyUnlockGrant,
  applyPdfWatermark,
  logDocumentActivity
} from '@/lib/documentSecurityService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const share = await (prisma as any).documentShare.findUnique({
      where: { shareToken: token },
      include: {
        document: {
          include: {
            student: { select: { name: true } }
          }
        }
      }
    })

    if (!share || share.isRevoked) {
      return NextResponse.json({ error: 'Invalid or revoked share link' }, { status: 404 })
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: '⏱ ACCESS EXPIRED: This share link has expired.' }, { status: 410 })
    }

    if (share.maxAccessCount && share.accessCount >= share.maxAccessCount) {
      return NextResponse.json({ error: 'Access limit reached on this share link.' }, { status: 410 })
    }

    const doc = share.document

    // Check Password & Unlock Grant (if password protected)
    const grantToken = request.nextUrl.searchParams.get('grant')
    if (share.passwordHash) {
      if (!grantToken || !verifyUnlockGrant(grantToken, doc.id)) {
        return NextResponse.json({ error: 'Password unlock required', requiresPassword: true }, { status: 401 })
      }
    }

    const isDownload = request.nextUrl.searchParams.get('download') === 'true'
    if (isDownload && (share.isViewOnly || !share.allowDownload)) {
      return NextResponse.json({ error: '👁 View Only: Downloading is disabled for this shared document.' }, { status: 403 })
    }

    // Increment Access Count
    await (prisma as any).documentShare.update({
      where: { id: share.id },
      data: { accessCount: { increment: 1 } }
    })

    // Read & Decrypt
    const rawBuffer = await readFromVault(doc.filePath)
    let decryptedBuffer = rawBuffer

    if (doc.isEncrypted && doc.encryptionIv && doc.encryptionTag) {
      try {
        decryptedBuffer = decryptDocumentBuffer(rawBuffer, doc.encryptionIv, doc.encryptionTag)
      } catch (err) {
        return NextResponse.json({ error: 'Decryption error' }, { status: 500 })
      }
    }

    const isPdf = doc.fileType.includes('pdf') || doc.fileName.toLowerCase().endsWith('.pdf')
    let finalBuffer = decryptedBuffer

    // Apply dynamic watermark
    if (isPdf) {
      finalBuffer = await applyPdfWatermark(decryptedBuffer, {
        actorName: share.recipientEmail || 'External Shared Recipient',
        actorRole: 'Shared Access',
        documentId: doc.id,
        sha256Hash: doc.sha256Hash || undefined,
        customText: 'PLACEIQ SECURE SHARE'
      })
    }

    await logDocumentActivity({
      documentId: doc.id,
      actorName: share.recipientEmail || 'Shared Recipient',
      actorRole: 'Guest',
      action: isDownload ? 'DOCUMENT_DOWNLOADED' : 'DOCUMENT_VIEWED',
      details: `${isDownload ? 'Downloaded' : 'Viewed'} via secure share link (${share.accessCount + 1}/${share.maxAccessCount || 'unlimited'}).`,
      status: 'SUCCESS'
    })

    const disposition = isDownload ? 'attachment' : 'inline'
    const contentType = normalizeFileType(doc.fileName, doc.fileType)

    return new NextResponse(new Uint8Array(finalBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(doc.fileName)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Document-View-Only': share.isViewOnly ? 'true' : 'false'
      }
    })
  } catch (error: any) {
    console.error('Shared stream error:', error)
    return NextResponse.json({ error: 'Failed to stream shared document' }, { status: 500 })
  }
}
