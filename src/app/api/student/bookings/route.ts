import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const bookingSchema = z.object({
  resourceId: z.number(),
  purpose: z.string().min(2, 'Purpose is required').trim(),
  startTime: z.string(),
  endTime: z.string()
})

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentBookings = await prisma.resourceBooking.findMany({
      where: {
        studentId: session.userId
      },
      include: {
        resource: {
          include: {
            institution: { select: { name: true } }
          }
        }
      },
      orderBy: { startTime: 'desc' }
    })

    return NextResponse.json({
      success: true,
      bookings: studentBookings.map((b: any) => ({
        id: b.id,
        resourceId: b.resourceId,
        resourceName: b.resource.name,
        category: b.resource.category || b.resource.type || 'Other',
        location: b.resource.location || '',
        ownerName: b.resource.institution?.name,
        purpose: b.purpose,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        rejectionReason: b.rejectionReason,
        createdAt: b.createdAt
      }))
    })

  } catch (error: any) {
    console.error('Error fetching student bookings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = bookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation Error', details: (parsed.error as any).errors }, { status: 400 })
    }

    const { resourceId, purpose, startTime, endTime } = parsed.data
    const reqStart = new Date(startTime)
    const reqEnd = new Date(endTime)

    if (reqStart >= reqEnd) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 })
    }

    // 1. Fetch student and verify institutionId
    const student = await prisma.student.findUnique({
      where: { id: session.userId },
      select: { institutionId: true, name: true }
    })

    if (!student || !student.institutionId) {
      return NextResponse.json({ error: 'Student institution profile not set' }, { status: 403 })
    }

    const studentInstId = student.institutionId

    // 2. Fetch resource to verify availability and student access permissions
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { institution: { select: { name: true } } }
    })

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    if (resource.status !== 'ACTIVE' && resource.status !== 'AVAILABLE' && resource.status !== 'active') {
      return NextResponse.json({ error: 'This resource is currently unavailable or under maintenance' }, { status: 400 })
    }

    if (!resource.availableToStudents) {
      return NextResponse.json({ error: 'This resource has not been made available to students' }, { status: 403 })
    }

    // 3. Verify access authorization
    const isOwned = resource.institutionId === studentInstId
    let isShared = false

    if (!isOwned) {
      // Check for active sharing agreement
      const agreement = await prisma.sharingAgreement.findFirst({
        where: {
          resourceId: resource.id,
          requestingInstitutionId: studentInstId,
          status: 'active'
        }
      })
      if (agreement) {
        isShared = true
      }
    }

    if (!isOwned && !isShared) {
      return NextResponse.json({ error: 'You do not have permission to access this resource' }, { status: 403 })
    }

    // 4. Overlapping booking conflict checks (on the same resource)
    const resourceConflict = await prisma.resourceBooking.findFirst({
      where: {
        resourceId,
        status: { in: ['confirmed', 'approved', 'pending'] },
        startTime: { lt: reqEnd },
        endTime: { gt: reqStart }
      }
    })

    if (resourceConflict) {
      return NextResponse.json({ error: 'This resource is already booked during the selected time.' }, { status: 400 })
    }

    // 5. Overlapping booking conflict checks (for the same student)
    const studentConflict = await prisma.resourceBooking.findFirst({
      where: {
        studentId: session.userId,
        status: { in: ['confirmed', 'approved', 'pending'] },
        startTime: { lt: reqEnd },
        endTime: { gt: reqStart }
      }
    })

    if (studentConflict) {
      return NextResponse.json({ error: 'You already have another pending or confirmed booking during this time.' }, { status: 400 })
    }

    // 6. Create the pending booking request
    const booking = await prisma.resourceBooking.create({
      data: {
        resourceId,
        studentId: session.userId,
        purpose,
        startTime: reqStart,
        endTime: reqEnd,
        status: 'pending' // Student bookings are PENDING by default
      }
    })

    // 7. Create notification for resource owner institution admin
    await prisma.resourceSharingNotification.create({
      data: {
        institutionId: resource.institutionId,
        message: `New booking request for ${resource.name} from student ${student.name}.`,
        read: false
      }
    })

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: 'Your booking request has been submitted successfully.'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating student booking:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
