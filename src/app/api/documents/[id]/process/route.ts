import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { readFromVault } from '@/lib/storage'
import { processAndVerifyDocument } from '@/lib/documentQualityService'

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

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        student: {
          select: { id: true, name: true, email: true, college: true }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Permission check
    if (session.role === 'student' && document.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Set status to PROCESSING
    await prisma.document.update({
      where: { id: docId },
      data: {
        verificationStatus: 'PROCESSING'
      }
    })

    // Read document buffer from storage
    const buffer = await readFromVault(document.filePath)

    if (!buffer || buffer.length === 0) {
      await prisma.document.update({
        where: { id: docId },
        data: {
          verificationStatus: 'FAILED',
          rejectionReason: 'Document file could not be read from vault storage.'
        }
      })
      return NextResponse.json({ error: 'File content not found in vault' }, { status: 404 })
    }

    // Run Docling + Groq pipeline
    const report = await processAndVerifyDocument(
      buffer,
      document.fileName,
      document.fileType,
      {
        name: document.student?.name,
        email: document.student?.email,
        college: document.student?.college || undefined
      }
    )

    // Persist verified results to database
    const updatedDoc = await prisma.document.update({
      where: { id: docId },
      data: {
        documentType: report.documentType || document.documentType,
        verificationStatus: report.verificationStatus,
        qualityScore: report.qualityScore,
        qualityResult: JSON.stringify(report),
        extractedInformation: JSON.stringify(report.extractedInformation),
        verifiedAt: report.verificationStatus === 'VERIFIED' ? new Date() : null,
        rejectionReason: report.verificationStatus === 'REJECTED' ? (report.warnings[0] || report.explanation) : null
      }
    })

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      report
    })
  } catch (error: any) {
    console.error('Document processing error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process document' }, { status: 500 })
  }
}
