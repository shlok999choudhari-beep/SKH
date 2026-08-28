import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { readFromVault } from '@/lib/storage'
import { analyzeDocumentIntegrity, saveTamperAnalysis } from '@/lib/tamperDetectionService'

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
        tamperAnalysis: {
          include: { signals: true }
        }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const t = doc.tamperAnalysis
    return NextResponse.json({
      success: true,
      documentId: doc.id,
      fileName: doc.fileName,
      tamperAnalysis: t ? {
        overallRiskLevel: t.overallRiskLevel,
        tamperScore: t.tamperScore,
        integrityScore: Math.round(100 - t.tamperScore),
        elaScore: t.elaScore,
        noiseScore: t.noiseScore,
        edgeInconsistencyScore: t.edgeInconsistencyScore,
        compressionScore: t.compressionScore,
        fontInconsistencyScore: t.fontInconsistencyScore,
        pdfMetadataRiskScore: t.pdfMetadataRiskScore,
        pdfMetadata: t.pdfMetadata ? JSON.parse(t.pdfMetadata) : null,
        summary: t.summary,
        signals: t.signals
      } : null
    })
  } catch (error: any) {
    console.error('Fetch tamper analysis error:', error)
    return NextResponse.json({ error: 'Failed to fetch tamper analysis' }, { status: 500 })
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

    const tamperResult = await analyzeDocumentIntegrity(buffer, doc.fileName, doc.fileType)
    await saveTamperAnalysis(docId, tamperResult)

    await prisma.document.update({
      where: { id: docId },
      data: {
        tamperScore: tamperResult.tamperScore
      }
    })

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      tamperAnalysis: tamperResult
    })
  } catch (error: any) {
    console.error('Execute tamper analysis error:', error)
    return NextResponse.json({ error: error.message || 'Failed to execute tamper analysis' }, { status: 500 })
  }
}
