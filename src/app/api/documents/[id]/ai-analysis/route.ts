import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { performAIReasoning } from '@/lib/aiReasoningService'

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
        aiAnalysis: {
          include: { evidences: true }
        }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      fileName: doc.fileName,
      aiAnalysis: doc.aiAnalysis
    })
  } catch (error: any) {
    console.error('Fetch AI analysis error:', error)
    return NextResponse.json({ error: 'Failed to fetch AI analysis' }, { status: 500 })
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

    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        student: {
          select: { name: true, email: true, college: true, degree: true }
        },
        ocrResult: { select: { fullText: true } }
      }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const extracted = doc.extractedInformation ? JSON.parse(doc.extractedInformation) : {}
    const aiResult = await performAIReasoning(docId, {
      documentType: doc.documentType,
      fileName: doc.fileName,
      extractedFields: extracted,
      ocrTextSample: doc.ocrResult?.fullText || '',
      studentProfile: doc.student || undefined
    })

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      aiAnalysis: aiResult
    })
  } catch (error: any) {
    console.error('Execute AI analysis error:', error)
    return NextResponse.json({ error: error.message || 'Failed to execute AI analysis' }, { status: 500 })
  }
}
