import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { logDocumentActivity } from '@/lib/documentSecurityService'
import { z } from 'zod'

const restoreVersionSchema = z.object({
  targetVersionId: z.number().int().positive()
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
        parentDocument: {
          include: {
            childVersions: true
          }
        },
        childVersions: true,
        student: { select: { id: true, name: true } }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Trace root document
    const rootId = doc.parentDocumentId || doc.id

    const allVersions = await prisma.document.findMany({
      where: {
        OR: [
          { id: rootId },
          { parentDocumentId: rootId },
          { id: docId }
        ]
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        version: true,
        versionNotes: true,
        sha256Hash: true,
        uploadedAt: true,
        verificationStatus: true,
        securityLevel: true
      }
    })

    return NextResponse.json({
      success: true,
      currentVersionId: doc.id,
      currentVersion: doc.version,
      versions: allVersions
    })
  } catch (error: any) {
    console.error('Fetch document versions error:', error)
    return NextResponse.json({ error: 'Failed to fetch version history' }, { status: 500 })
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

    const currentDoc = await prisma.document.findUnique({
      where: { id: docId },
      include: { student: true }
    })

    if (!currentDoc || currentDoc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Document not found or forbidden' }, { status: 404 })
    }

    const body = await request.json()
    const { targetVersionId } = restoreVersionSchema.parse(body)

    const targetDoc = await prisma.document.findUnique({
      where: { id: targetVersionId }
    })

    if (!targetDoc || targetDoc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Target version not found' }, { status: 404 })
    }

    // Create a new version that copies the payload of targetDoc but sets version = max + 1
    const nextVersion = currentDoc.version + 1

    const restoredDoc = await prisma.document.create({
      data: {
        studentId: session.userId,
        institutionId: currentDoc.institutionId,
        fileName: targetDoc.fileName,
        filePath: targetDoc.filePath,
        fileType: targetDoc.fileType,
        fileSize: targetDoc.fileSize,
        documentType: targetDoc.documentType,
        category: targetDoc.category,
        description: targetDoc.description,
        accessLevel: currentDoc.accessLevel,
        verificationStatus: targetDoc.verificationStatus,
        sha256Hash: targetDoc.sha256Hash,
        version: nextVersion,
        parentDocumentId: currentDoc.parentDocumentId || currentDoc.id,
        securityLevel: currentDoc.securityLevel,
        isEncrypted: targetDoc.isEncrypted,
        encryptionIv: targetDoc.encryptionIv,
        encryptionTag: targetDoc.encryptionTag,
        passwordHash: currentDoc.passwordHash,
        isPasswordProtected: currentDoc.isPasswordProtected,
        isViewOnly: currentDoc.isViewOnly,
        downloadPolicy: currentDoc.downloadPolicy,
        maxDownloads: currentDoc.maxDownloads,
        watermarkEnabled: currentDoc.watermarkEnabled,
        watermarkText: currentDoc.watermarkText,
        versionNotes: `Restored from Version ${targetDoc.version} (${targetDoc.fileName})`
      }
    })

    await logDocumentActivity({
      documentId: restoredDoc.id,
      actorId: session.userId,
      actorName: currentDoc.student.name || 'Student',
      actorRole: 'student',
      action: 'DOCUMENT_RESTORED',
      details: `Restored Version ${targetDoc.version} as new Version ${nextVersion}.`,
      status: 'SUCCESS'
    })

    return NextResponse.json({
      success: true,
      restoredDocument: restoredDoc,
      message: `Version ${targetDoc.version} restored as Version ${nextVersion}`
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Restore document version error:', error)
    return NextResponse.json({ error: 'Failed to restore document version' }, { status: 500 })
  }
}
