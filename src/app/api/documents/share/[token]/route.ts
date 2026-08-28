import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyDocumentPassword,
  createUnlockGrant,
  logDocumentActivity
} from '@/lib/documentSecurityService'
import { z } from 'zod'

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
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            documentType: true,
            category: true,
            sha256Hash: true,
            uploadedAt: true,
            securityLevel: true,
            isViewOnly: true,
            watermarkEnabled: true,
            publicVerificationId: true,
            student: {
              select: { name: true, college: true }
            },
            institution: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!share) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    if (share.isRevoked) {
      return NextResponse.json({
        error: 'This secure share link has been revoked by the owner.',
        isRevoked: true
      }, { status: 410 })
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({
        error: '⏱ ACCESS EXPIRED: This secure document share link has expired.',
        isExpired: true
      }, { status: 410 })
    }

    if (share.maxAccessCount && share.accessCount >= share.maxAccessCount) {
      return NextResponse.json({
        error: 'Access limit reached: This one-time or limited share link has exhausted its access count.',
        limitReached: true
      }, { status: 410 })
    }

    const requiresPassword = Boolean(share.passwordHash)

    return NextResponse.json({
      success: true,
      share: {
        token: share.shareToken,
        isViewOnly: share.isViewOnly || !share.allowDownload,
        allowDownload: share.allowDownload && !share.isViewOnly,
        requiresPassword,
        expiresAt: share.expiresAt,
        accessCount: share.accessCount,
        maxAccessCount: share.maxAccessCount,
        document: share.document
      }
    })
  } catch (error: any) {
    console.error('Validate share token error:', error)
    return NextResponse.json({ error: 'Failed to validate share link' }, { status: 500 })
  }
}

const unlockShareSchema = z.object({
  password: z.string().min(1, 'Password is required')
})

export async function POST(
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
      include: { document: true }
    })

    if (!share || share.isRevoked) {
      return NextResponse.json({ error: 'Invalid or revoked share link' }, { status: 404 })
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    if (!share.passwordHash) {
      const grantToken = createUnlockGrant(share.document.id, 0)
      return NextResponse.json({ success: true, unlocked: true, grantToken })
    }

    const body = await request.json()
    const { password } = unlockShareSchema.parse(body)

    const isValid = await verifyDocumentPassword(password, share.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect share password' }, { status: 401 })
    }

    const grantToken = createUnlockGrant(share.document.id, 0)

    await logDocumentActivity({
      documentId: share.document.id,
      actorName: 'Shared Recipient',
      actorRole: 'Guest',
      action: 'DOCUMENT_PASSWORD_SUCCESS',
      details: 'Recipient unlocked shared document with password.',
      status: 'SUCCESS'
    })

    return NextResponse.json({
      success: true,
      unlocked: true,
      grantToken
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }
    console.error('Unlock share error:', error)
    return NextResponse.json({ error: 'Failed to unlock share link' }, { status: 500 })
  }
}
