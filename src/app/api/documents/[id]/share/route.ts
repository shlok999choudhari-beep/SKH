import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import {
  generateShareToken,
  hashDocumentPassword,
  logDocumentActivity
} from '@/lib/documentSecurityService'
import { z } from 'zod'

const createShareSchema = z.object({
  recipientEmail: z.string().email().optional().or(z.literal('')),
  isViewOnly: z.boolean().default(true),
  allowDownload: z.boolean().default(false),
  password: z.string().optional(),
  maxAccessCount: z.number().int().positive().nullable().optional(),
  expiresIn: z.enum(['1_HOUR', '24_HOURS', '7_DAYS', '30_DAYS', 'NEVER']).default('24_HOURS'),
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
      where: { id: docId }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const shares = await (prisma as any).documentShare.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      shares
    })
  } catch (error: any) {
    console.error('Fetch shares error:', error)
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
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

    if (!doc || doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Document not found or forbidden' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createShareSchema.parse(body)

    let expiresAt: Date | null = null
    if (validated.expiresIn === '1_HOUR') {
      expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    } else if (validated.expiresIn === '24_HOURS') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    } else if (validated.expiresIn === '7_DAYS') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    } else if (validated.expiresIn === '30_DAYS') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    let passwordHash: string | null = null
    if (validated.password && validated.password.trim().length > 0) {
      passwordHash = await hashDocumentPassword(validated.password.trim())
    }

    const shareToken = generateShareToken()

    const share = await (prisma as any).documentShare.create({
      data: {
        documentId: docId,
        shareToken,
        createdByUserId: session.userId,
        recipientEmail: validated.recipientEmail || null,
        isViewOnly: validated.isViewOnly,
        allowDownload: validated.allowDownload,
        passwordHash,
        maxAccessCount: validated.maxAccessCount || null,
        accessCount: 0,
        expiresAt,
        isRevoked: false
      }
    })

    await logDocumentActivity({
      documentId: doc.id,
      actorId: session.userId,
      actorName: doc.student.name || 'Student',
      actorRole: 'student',
      action: 'DOCUMENT_SHARED',
      details: `Generated secure share link (Expires: ${validated.expiresIn}, View-Only: ${validated.isViewOnly}, Password: ${passwordHash ? 'Yes' : 'No'}).`,
      status: 'SUCCESS'
    })

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/verify/share/${shareToken}`

    return NextResponse.json({
      success: true,
      share,
      shareUrl
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Create share error:', error)
    return NextResponse.json({ error: 'Failed to create secure share link' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const docId = parseInt(id, 10)
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const shareId = parseInt(searchParams.get('shareId') || '', 10)

    if (isNaN(shareId)) {
      return NextResponse.json({ error: 'Invalid share ID' }, { status: 400 })
    }

    const share = await (prisma as any).documentShare.findUnique({
      where: { id: shareId },
      include: { document: true }
    })

    if (!share || share.document.studentId !== session.userId) {
      return NextResponse.json({ error: 'Share link not found or forbidden' }, { status: 404 })
    }

    await (prisma as any).documentShare.update({
      where: { id: shareId },
      data: { isRevoked: true }
    })

    await logDocumentActivity({
      documentId: docId,
      actorId: session.userId,
      actorName: 'Student',
      actorRole: 'student',
      action: 'DOCUMENT_SHARE_REVOKED',
      details: `Revoked secure share token (${share.shareToken.slice(0, 8)}...).`,
      status: 'SUCCESS'
    })

    return NextResponse.json({ success: true, message: 'Share link revoked successfully' })
  } catch (error: any) {
    console.error('Revoke share error:', error)
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 })
  }
}
