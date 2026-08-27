import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { readFromVault } from '@/lib/storage'
import { detectDocumentRegions, saveYOLODetections } from '@/lib/yoloRegionService'

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
      include: { yoloDetections: true }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formattedRegions = doc.yoloDetections.map(d => ({
      id: d.id,
      objectType: d.objectType,
      confidence: d.confidence,
      boundingBox: (() => {
        try { return JSON.parse(d.boundingBox) } catch { return [0, 0, 0, 0] }
      })(),
      pageNumber: d.pageNumber,
      createdAt: d.createdAt
    }))

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      fileName: doc.fileName,
      regionsCount: formattedRegions.length,
      regions: formattedRegions
    })
  } catch (error: any) {
    console.error('Fetch document YOLO regions error:', error)
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
  }
}

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

    const doc = await prisma.document.findUnique({ where: { id: docId } })
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const buffer = await readFromVault(doc.filePath)
    if (!buffer) {
      return NextResponse.json({ error: 'Document file not found' }, { status: 404 })
    }

    const yoloResult = await detectDocumentRegions(buffer, doc.fileName, doc.fileType)
    await saveYOLODetections(docId, yoloResult.regions)

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      analysis: yoloResult
    })
  } catch (error: any) {
    console.error('Analyze document regions error:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze regions' }, { status: 500 })
  }
}
