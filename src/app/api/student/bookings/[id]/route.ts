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
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = parseInt(id, 10)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
    }

    const body = await request.json()
    if (body.action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action. Only cancel is supported' }, { status: 400 })
    }

    // Find the booking
    const booking = await prisma.resourceBooking.findUnique({
      where: { id: bookingId },
      include: {
        resource: true,
        student: { select: { name: true } }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Guard: Verify student owns this booking
    if (booking.studentId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized to cancel this booking' }, { status: 403 })
    }

    // Guard: Can only cancel pending or confirmed/approved bookings
    if (booking.status !== 'pending' && booking.status !== 'confirmed' && booking.status !== 'approved') {
      return NextResponse.json({ error: `Cannot cancel a booking that is already ${booking.status}` }, { status: 400 })
    }

    // Guard: Cannot cancel past bookings
    const now = new Date()
    if (new Date(booking.startTime) <= now) {
      return NextResponse.json({ error: 'Cannot cancel active or completed past bookings' }, { status: 400 })
    }

    // Update status to cancelled
    const updatedBooking = await prisma.resourceBooking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled'
      }
    })

    // Create notification for resource owner institution admin
    await prisma.resourceSharingNotification.create({
      data: {
        institutionId: booking.resource.institutionId,
        message: `Student ${booking.student?.name || 'Student'} has cancelled their booking for ${booking.resource.name}.`,
        read: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking: updatedBooking
    })

  } catch (error: any) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
