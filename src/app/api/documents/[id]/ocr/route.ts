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
      include: { ocrResult: true }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const ocr = doc.ocrResult
    return NextResponse.json({
      success: true,
      documentId: doc.id,
      fileName: doc.fileName,
      ocr: ocr ? {
        fullText: ocr.fullText,
        blocks: ocr.textBlocks ? JSON.parse(ocr.textBlocks) : [],
        boundingBoxes: ocr.boundingBoxes ? JSON.parse(ocr.boundingBoxes) : [],
        confidence: ocr.confidence,
        engine: ocr.engine,
        language: ocr.language,
        pageCount: ocr.pageCount,
        createdAt: ocr.createdAt
      } : null
    })
  } catch (error: any) {
    console.error('Fetch document OCR error:', error)
    return NextResponse.json({ error: 'Failed to fetch OCR results' }, { status: 500 })
  }
}
