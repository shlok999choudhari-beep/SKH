import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = parseInt(id, 10)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
    }

    const body = await request.json()
    const { action, rejectionReason } = body

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action. Only approve or reject is supported' }, { status: 400 })
    }

    // Find the booking
    const booking = await prisma.resourceBooking.findUnique({
      where: { id: bookingId },
      include: { resource: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking request not found' }, { status: 404 })
    }

    // Get institution ID
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { institutionId: true }
    })

    if (!user || !user.institutionId) {
      return NextResponse.json({ error: 'Institution profile not found' }, { status: 404 })
    }

    // Guard: Verify resource is owned by the logged-in institution
    if (booking.resource.institutionId !== user.institutionId) {
      return NextResponse.json({ error: 'Unauthorized to manage this booking' }, { status: 403 })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ error: `Cannot process a booking that is already ${booking.status}` }, { status: 400 })
    }

    if (action === 'approve') {
      // Re-verify conflicts before final approval
      const conflict = await prisma.resourceBooking.findFirst({
        where: {
          id: { not: bookingId },
          resourceId: booking.resourceId,
          status: { in: ['confirmed', 'approved'] },
          startTime: { lt: booking.endTime },
          endTime: { gt: booking.startTime }
        }
      })

      if (conflict) {
        return NextResponse.json({ error: 'Cannot approve: this time slot overlaps with an already confirmed booking.' }, { status: 400 })
      }

      await prisma.resourceBooking.update({
        where: { id: bookingId },
        data: {
          status: 'approved'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Booking request has been approved successfully.'
      })

    } else {
      // Reject action
      await prisma.resourceBooking.update({
        where: { id: bookingId },
        data: {
          status: 'rejected',
          rejectionReason: rejectionReason || 'No reason provided'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Booking request has been rejected.'
      })
    }

  } catch (error: any) {
    console.error('Error handling booking request decision:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
