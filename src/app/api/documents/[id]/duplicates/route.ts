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
        sourceDuplicates: {
          include: {
            matchedDocument: {
              select: {
                id: true,
                fileName: true,
                uploadedAt: true,
                studentId: true
              }
            }
          }
        }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const duplicates = doc.sourceDuplicates.map(d => ({
      matchedDocumentId: d.matchedDocumentId,
      matchedFileName: d.matchedDocument.fileName,
      matchType: d.matchType,
      similarityScore: d.similarityScore,
      details: d.details,
      uploadedAt: d.matchedDocument.uploadedAt
    }))

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      fileName: doc.fileName,
      sha256Hash: doc.sha256Hash,
      perceptualHash: doc.perceptualHash,
      duplicateCount: duplicates.length,
      isDuplicate: duplicates.length > 0,
      duplicates
    })
  } catch (error: any) {
    console.error('Fetch document duplicates error:', error)
    return NextResponse.json({ error: 'Failed to fetch duplicate results' }, { status: 500 })
  }
}
