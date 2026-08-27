import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { institutionId: true }
    })

    if (!user || !user.institutionId) {
      return NextResponse.json({ error: 'Institution profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const studentIdParam = searchParams.get('studentId') || ''

    const where: any = {
      institutionId: user.institutionId,
      accessLevel: { in: ['INSTITUTION_ONLY', 'SHARED'] } // Must NOT include PRIVATE documents
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (status && status !== 'ALL') {
      where.verificationStatus = status
    }

    if (studentIdParam) {
      const sId = parseInt(studentIdParam, 10)
      if (!isNaN(sId)) {
        where.studentId = sId
      }
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { documentType: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, college: true, degree: true, cgpa: true }
        },
        verification: true,
        ocrResult: true,
        extractedFields: true,
        qrCodeResults: true,
        sourceDuplicates: {
          include: {
            matchedDocument: {
              select: { id: true, fileName: true, uploadedAt: true }
            }
          }
        },
        history: {
          orderBy: { changedAt: 'desc' }
        },
        yoloDetections: true,
        faceVerifications: true,
        tamperAnalysis: {
          include: { signals: true }
        },
        aiAnalysis: {
          include: { evidences: true }
        },
        verificationStages: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    // Compute live Admin Forensic Dashboard Metrics
    const allInstitutionDocs = await prisma.document.findMany({
      where: {
        institutionId: user.institutionId,
        accessLevel: { in: ['INSTITUTION_ONLY', 'SHARED'] }
      },
      select: {
        verificationStatus: true,
        processingStatus: true,
        verificationScore: true,
        ocrConfidence: true,
        qrStatus: true,
        tamperScore: true,
        faceMatchStatus: true,
        aiRiskLevel: true,
        sourceDuplicates: { select: { id: true } },
        tamperAnalysis: { select: { overallRiskLevel: true } }
      }
    })

    const total = allInstitutionDocs.length
    const verified = allInstitutionDocs.filter(d => d.verificationStatus === 'VERIFIED').length
    const underReview = allInstitutionDocs.filter(d => d.verificationStatus === 'UNDER_REVIEW' || d.verificationStatus === 'NEEDS_REVIEW' || d.verificationStatus === 'PENDING').length
    const suspicious = allInstitutionDocs.filter(d => d.verificationStatus === 'SUSPICIOUS').length
    const rejected = allInstitutionDocs.filter(d => d.verificationStatus === 'REJECTED').length
    const processing = allInstitutionDocs.filter(d => d.processingStatus === 'PROCESSING' || d.processingStatus === 'OCR_PROCESSING' || d.processingStatus === 'VERIFYING').length

    const highRisk = allInstitutionDocs.filter(d => d.aiRiskLevel === 'HIGH' || d.tamperAnalysis?.overallRiskLevel === 'HIGH' || (typeof d.tamperScore === 'number' && d.tamperScore >= 50)).length
    const tamperAlerts = allInstitutionDocs.filter(d => typeof d.tamperScore === 'number' && d.tamperScore >= 35).length
    const faceFailures = allInstitutionDocs.filter(d => d.faceMatchStatus === 'NO_MATCH').length

    const scores = allInstitutionDocs.map(d => d.verificationScore).filter((s): s is number => typeof s === 'number')
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    const ocrConfs = allInstitutionDocs.map(d => d.ocrConfidence).filter((c): c is number => typeof c === 'number')
    const avgOcrConf = ocrConfs.length > 0 ? Math.round((ocrConfs.reduce((a, b) => a + b, 0) / ocrConfs.length) * 100) : 0

    const qrMismatches = allInstitutionDocs.filter(d => d.qrStatus === 'QR_MISMATCH').length
    const duplicates = allInstitutionDocs.filter(d => d.sourceDuplicates && d.sourceDuplicates.length > 0).length
    const manualReviewRate = total > 0 ? Math.round((underReview / total) * 100) : 0

    const metrics = {
      totalDocuments: total,
      verifiedCount: verified,
      underReviewCount: underReview,
      suspiciousCount: suspicious,
      rejectedCount: rejected,
      processingCount: processing,
      highRiskCount: highRisk,
      tamperAlertsCount: tamperAlerts,
      faceFailuresCount: faceFailures,
      averageVerificationScore: avgScore,
      averageOcrConfidence: avgOcrConf,
      qrMismatchesCount: qrMismatches,
      duplicatesCount: duplicates,
      manualReviewRate
    }

    return NextResponse.json({
      success: true,
      documents,
      metrics
    })
  } catch (error: any) {
    console.error('Fetch institution shared documents error:', error)
    return NextResponse.json({ error: 'Failed to fetch shared documents' }, { status: 500 })
  }
}
