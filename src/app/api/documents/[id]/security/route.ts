import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { hashDocumentPassword, logDocumentActivity, verifyStoredDocumentIntegrity } from '@/lib/documentSecurityService'
import { z } from 'zod'

const updateSecuritySchema = z.object({
  securityLevel: z.enum(['STANDARD', 'PROTECTED', 'HIGHLY_PROTECTED']).optional(),
  password: z.string().optional(),
  removePassword: z.boolean().optional(),
  isViewOnly: z.boolean().optional(),
  downloadPolicy: z.enum(['UNLIMITED', 'LIMITED', 'DISABLED']).optional(),
  maxDownloads: z.number().nullable().optional(),
  accessExpiry: z.string().optional(),
  expiryDate: z.string().nullable().optional(),
  watermarkEnabled: z.boolean().optional(),
  watermarkText: z.string().nullable().optional(),
  unlockDocument: z.boolean().optional(),
})

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
        student: {
          select: { id: true, name: true, email: true }
        },
        institution: {
          select: { id: true, name: true }
        }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Permission check
    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    } else if (session.role === 'institution-admin') {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { institutionId: true }
      })
      if (!user || user.institutionId !== doc.institutionId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Safely load shares and activities
    let shares: any[] = []
    let activities: any[] = []
    try {
      shares = await (prisma as any).documentShare.findMany({
        where: { documentId: docId, isRevoked: false },
        select: { id: true, shareToken: true, accessCount: true, maxAccessCount: true, expiresAt: true, isViewOnly: true }
      })
    } catch (err) {
      console.warn('Shares fetch fallback:', err)
    }

    try {
      activities = await (prisma as any).documentActivity.findMany({
        where: { documentId: docId },
        take: 10,
        orderBy: { timestamp: 'desc' }
      })
    } catch (err) {
      console.warn('Activities fetch fallback:', err)
    }

    // Verify integrity status safely
    let integrityResult = { verified: true, computedHash: doc.sha256Hash }
    try {
      integrityResult = await verifyStoredDocumentIntegrity(doc.id)
    } catch (err) {
      console.warn('Integrity verification fallback:', err)
    }

    // Check if lock expired
    let isCurrentlyLocked = doc.isLocked
    if (doc.isLocked && doc.lockedUntil && new Date() > doc.lockedUntil) {
      isCurrentlyLocked = false
      try {
        await prisma.document.update({
          where: { id: doc.id },
          data: { isLocked: false, lockedUntil: null, failedPasswordAttempts: 0 }
        })
      } catch {}
    }

    return NextResponse.json({
      success: true,
      security: {
        documentId: doc.id,
        fileName: doc.fileName,
        securityLevel: doc.securityLevel || 'STANDARD',
        isEncrypted: doc.isEncrypted,
        isPasswordProtected: doc.isPasswordProtected,
        isLocked: isCurrentlyLocked,
        lockedUntil: doc.lockedUntil,
        failedPasswordAttempts: doc.failedPasswordAttempts,
        isViewOnly: doc.isViewOnly,
        downloadPolicy: doc.downloadPolicy,
        maxDownloads: doc.maxDownloads,
        downloadCount: doc.downloadCount,
        accessExpiry: doc.accessExpiry,
        expiryDate: doc.expiryDate,
        watermarkEnabled: doc.watermarkEnabled,
        watermarkText: doc.watermarkText,
        sha256Hash: doc.sha256Hash,
        publicVerificationId: doc.publicVerificationId,
        integrityVerified: integrityResult.verified,
        integrityComputedHash: integrityResult.computedHash,
        activeSharesCount: shares.length,
        totalActivitiesCount: activities.length,
        recentActivities: activities,
      }
    })
  } catch (error: any) {
    console.error('Fetch document security error:', error)
    return NextResponse.json({ error: 'Failed to fetch security settings: ' + (error?.message || error) }, { status: 500 })
  }

}

export async function PATCH(
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
      include: { student: true }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Only owner or institution admin can modify security
    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validated = updateSecuritySchema.parse(body)

    const updateData: any = {}

    if (validated.securityLevel) {
      updateData.securityLevel = validated.securityLevel
      if (validated.securityLevel === 'HIGHLY_PROTECTED') {
        updateData.isViewOnly = true
        updateData.watermarkEnabled = true
      }
    }

    if (validated.removePassword) {
      updateData.passwordHash = null
      updateData.isPasswordProtected = false
      updateData.failedPasswordAttempts = 0
      updateData.isLocked = false
      updateData.lockedUntil = null
    } else if (validated.password && validated.password.trim().length > 0) {
      updateData.passwordHash = await hashDocumentPassword(validated.password.trim())
      updateData.isPasswordProtected = true
      updateData.failedPasswordAttempts = 0
      updateData.isLocked = false
      updateData.lockedUntil = null
    }

    if (validated.isViewOnly !== undefined) {
      updateData.isViewOnly = validated.isViewOnly
    }

    if (validated.downloadPolicy) {
      updateData.downloadPolicy = validated.downloadPolicy
    }

    if (validated.maxDownloads !== undefined) {
      updateData.maxDownloads = validated.maxDownloads
    }

    if (validated.accessExpiry) {
      updateData.accessExpiry = validated.accessExpiry
      if (validated.accessExpiry === '1_HOUR') {
        updateData.expiryDate = new Date(Date.now() + 60 * 60 * 1000)
      } else if (validated.accessExpiry === '24_HOURS') {
        updateData.expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      } else if (validated.accessExpiry === '7_DAYS') {
        updateData.expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } else if (validated.accessExpiry === 'NEVER') {
        updateData.expiryDate = null
      }
    }

    if (validated.expiryDate !== undefined) {
      updateData.expiryDate = validated.expiryDate ? new Date(validated.expiryDate) : null
    }

    if (validated.watermarkEnabled !== undefined) {
      updateData.watermarkEnabled = validated.watermarkEnabled
    }

    if (validated.watermarkText !== undefined) {
      updateData.watermarkText = validated.watermarkText
    }

    if (validated.unlockDocument) {
      updateData.isLocked = false
      updateData.lockedUntil = null
      updateData.failedPasswordAttempts = 0
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: updateData
    })

    // Log Activity
    await logDocumentActivity({
      documentId: doc.id,
      actorId: session.userId,
      actorName: doc.student.name || 'User',
      actorRole: session.role,
      action: 'DOCUMENT_SECURITY_UPDATED',
      details: `Security updated: Level=${updated.securityLevel}, ViewOnly=${updated.isViewOnly}, Watermark=${updated.watermarkEnabled}, Policy=${updated.downloadPolicy}`,
      status: 'SUCCESS'
    })

    return NextResponse.json({ success: true, document: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Update document security error:', error)
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 })
  }
}
