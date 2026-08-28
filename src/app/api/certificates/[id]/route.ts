import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

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
        course: { select: { id: true, title: true, slug: true } },
        student: { select: { id: true, name: true, email: true, college: true } },
        document: true,
        enrollment: {
          include: {
            completion: true
          }
        }
      }
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    if (session.role === 'student' && certificate.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ certificate })
  } catch (err: any) {
    console.error('Error fetching certificate details:', err)
    return NextResponse.json({ error: 'Failed to fetch certificate', details: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized. Only Institution Admins can revoke certificates.' }, { status: 401 })
    }

    const id = parseInt(resolvedParams.id, 10)
    const body = await req.json()
    const { action, reason } = body

    const certificate = await prisma.certificate.findUnique({
      where: { id }
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    if (action === 'revoke') {
      const updated = await prisma.certificate.update({
        where: { id },
        data: {
          status: 'revoked',
          revokedAt: new Date(),
          revokedReason: reason || 'Revoked by institution administration'
        }
      })

      // If linked with document vault, update document status
      if (certificate.documentId) {
        await prisma.document.update({
          where: { id: certificate.documentId },
          data: {
            verificationStatus: 'REJECTED',
            rejectionReason: reason || 'Certificate was revoked'
          }
        }).catch(() => {})
      }

      return NextResponse.json({ success: true, certificate: updated })
    } else if (action === 'restore') {
      const updated = await prisma.certificate.update({
        where: { id },
        data: {
          status: 'valid',
          revokedAt: null,
          revokedReason: null
        }
      })

      if (certificate.documentId) {
        await prisma.document.update({
          where: { id: certificate.documentId },
          data: {
            verificationStatus: 'VERIFIED',
            rejectionReason: null
          }
        }).catch(() => {})
      }

      return NextResponse.json({ success: true, certificate: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('Error updating certificate status:', err)
    return NextResponse.json({ error: 'Failed to update certificate', details: err.message }, { status: 500 })
  }
}
