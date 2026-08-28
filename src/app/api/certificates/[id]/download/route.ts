import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateCertificatePdf, generateCertificateQRCode } from '@/lib/certificateService'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(resolvedParams.id, 10)
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        course: { select: { title: true } },
        student: { select: { name: true } }
      }
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    if (session.role === 'student' && certificate.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const baseUrl = req.nextUrl.origin
    const verificationUrl = `${baseUrl}/verify/certificate/${certificate.certificateId}`

    const { pngBuffer } = await generateCertificateQRCode(verificationUrl)

    const pdfBuffer = await generateCertificatePdf({
      certificateId: certificate.certificateId,
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      instructorName: certificate.instructorName,
      institutionName: certificate.institutionName,
      completionDate: certificate.issueDate,
      verificationUrl
    }, pngBuffer)

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificate_${certificate.certificateId}.pdf"`,
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (err: any) {
    console.error('Error downloading certificate PDF:', err)
    return NextResponse.json({ error: 'Failed to download certificate', details: err.message }, { status: 500 })
  }
}
