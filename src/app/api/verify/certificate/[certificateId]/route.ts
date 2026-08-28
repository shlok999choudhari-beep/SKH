import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const resolvedParams = await params
    const certificateId = resolvedParams.certificateId?.trim().toUpperCase()

    if (!certificateId || !certificateId.startsWith('PIQ-CERT-')) {
      return NextResponse.json({
        valid: false,
        status: 'notFound',
        message: 'Invalid certificate identifier format.'
      }, { status: 404 })
    }

    const certificate = await prisma.certificate.findUnique({
      where: { certificateId },
      include: {
        course: { select: { title: true, slug: true } }
      }
    })

    if (!certificate) {
      return NextResponse.json({
        valid: false,
        status: 'notFound',
        message: 'Certificate not found. This credential may be invalid or not yet issued.'
      }, { status: 404 })
    }

    const isRevoked = certificate.status === 'revoked'

    // Return ONLY public sanitized verification info
    return NextResponse.json({
      valid: !isRevoked,
      status: certificate.status,
      certificateId: certificate.certificateId,
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      institutionName: certificate.institutionName || 'PlaceIQ Institution',
      instructorName: certificate.instructorName || 'PlaceIQ Certified Instructor',
      issueDate: certificate.issueDate,
      revokedAt: certificate.revokedAt,
      revokedReason: isRevoked ? (certificate.revokedReason || 'Revoked by institution administration') : null,
      verifiedAt: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('Error verifying certificate:', err)
    return NextResponse.json({
      valid: false,
      status: 'error',
      message: 'Failed to verify certificate'
    }, { status: 500 })
  }
}
