import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { readFromVault } from '@/lib/storage'
import { executeDocumentVerificationPipeline } from '@/lib/verificationService'

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
        student: {
          select: { id: true, name: true, email: true, college: true, degree: true, cgpa: true }
        }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Retrieve file buffer from storage
    const buffer = await readFromVault(doc.filePath)
    if (!buffer) {
      return NextResponse.json({ error: 'Document file not found in storage' }, { status: 404 })
    }

    // Re-run the full verification pipeline
    const result = await executeDocumentVerificationPipeline(
      doc.id,
      doc.studentId,
      buffer,
      doc.fileName,
      doc.fileType,
      doc.category,
      doc.documentType,
      doc.student || undefined
    )

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      verificationResult: result
    })
  } catch (error: any) {
    console.error('Reverify document error:', error)
    return NextResponse.json({ error: error.message || 'Failed to reverify document' }, { status: 500 })
  }
}
