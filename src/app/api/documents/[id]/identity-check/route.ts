import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { readFromVault } from '@/lib/storage'
import { performFaceVerification, saveFaceVerification } from '@/lib/faceVerificationService'

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
      include: { faceVerifications: true }
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (session.role === 'student' && doc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const latest = doc.faceVerifications[doc.faceVerifications.length - 1] || null

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      fileName: doc.fileName,
      faceVerification: latest
    })
  } catch (error: any) {
    console.error('Fetch identity verification error:', error)
    return NextResponse.json({ error: 'Failed to fetch identity check' }, { status: 500 })
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
        yoloDetections: true
      }
    })

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

    const hasPhoto = doc.yoloDetections.some(r => r.objectType === 'PHOTO')
    const result = await performFaceVerification(docId, doc.studentId, buffer, null, hasPhoto)
    await saveFaceVerification(docId, doc.studentId, result)

    await prisma.document.update({
      where: { id: docId },
      data: {
        faceMatchStatus: result.status,
        faceMatchScore: result.similarityScore
      }
    })

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      identityCheck: result
    })
  } catch (error: any) {
    console.error('Execute identity check error:', error)
    return NextResponse.json({ error: error.message || 'Failed to execute identity check' }, { status: 500 })
  }
}
