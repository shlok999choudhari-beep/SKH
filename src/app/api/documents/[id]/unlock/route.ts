import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import {
  verifyDocumentPassword,
  logDocumentActivity,
  createUnlockGrant
} from '@/lib/documentSecurityService'
import { z } from 'zod'

const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required')
})

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

    // Check if document is currently locked
    if (doc.isLocked) {
      if (doc.lockedUntil && new Date() < doc.lockedUntil) {
        const remainingMinutes = Math.ceil((doc.lockedUntil.getTime() - Date.now()) / 60000)
        return NextResponse.json({
          error: `Document temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s).`,
          isLocked: true,
          lockedUntil: doc.lockedUntil
        }, { status: 423 })
      } else {
        // Unlock expired
        await prisma.document.update({
          where: { id: docId },
          data: { isLocked: false, lockedUntil: null, failedPasswordAttempts: 0 }
        })
      }
    }

    // If document is not password protected, grant immediate access
    if (!doc.isPasswordProtected || !doc.passwordHash) {
      const grantToken = createUnlockGrant(doc.id, session.userId)
      return NextResponse.json({
        success: true,
        unlocked: true,
        grantToken
      })
    }

    const body = await request.json()
    const { password } = unlockSchema.parse(body)

    const isValid = await verifyDocumentPassword(password, doc.passwordHash)

    if (!isValid) {
      const newFailedCount = (doc.failedPasswordAttempts || 0) + 1
      const willLock = newFailedCount >= 5
      const lockedUntil = willLock ? new Date(Date.now() + 15 * 60 * 1000) : null

      await prisma.document.update({
        where: { id: docId },
        data: {
          failedPasswordAttempts: newFailedCount,
          isLocked: willLock,
          lockedUntil
        }
      })

      // Log Security Event
      await logDocumentActivity({
        documentId: doc.id,
        actorId: session.userId,
        actorName: doc.student.name || 'User',
        actorRole: session.role,
        action: willLock ? 'DOCUMENT_LOCKED' : 'DOCUMENT_PASSWORD_FAILED',
        details: willLock
          ? `Adaptive Security: 5 consecutive failed password attempts. Document locked for 15 minutes.`
          : `Failed password attempt (${newFailedCount}/5).`,
        status: willLock ? 'BLOCKED' : 'FAILED'
      })

      if (willLock) {
        return NextResponse.json({
          error: 'Adaptive Security Alert: 5 failed password attempts. Document is temporarily locked for 15 minutes.',
          isLocked: true,
          lockedUntil
        }, { status: 423 })
      }

      return NextResponse.json({
        error: `Incorrect document password. ${5 - newFailedCount} attempts remaining before temporary lock.`,
        attemptsRemaining: 5 - newFailedCount
      }, { status: 401 })
    }

    // Success: Reset failed attempts & issue unlock grant token
    await prisma.document.update({
      where: { id: docId },
      data: {
        failedPasswordAttempts: 0,
        isLocked: false,
        lockedUntil: null
      }
    })

    const grantToken = createUnlockGrant(doc.id, session.userId)

    await logDocumentActivity({
      documentId: doc.id,
      actorId: session.userId,
      actorName: doc.student.name || 'User',
      actorRole: session.role,
      action: 'DOCUMENT_PASSWORD_SUCCESS',
      details: 'Document unlocked successfully via password verification.',
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
    console.error('Document unlock error:', error)
    return NextResponse.json({ error: 'Failed to process unlock request' }, { status: 500 })
  }
}
