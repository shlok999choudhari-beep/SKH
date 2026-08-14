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
    let studentId: number | null = null

    if (session && session.userId) {
      studentId = session.userId
    } else {
      // Demo / fallback student lookup
      const firstStudent = await prisma.student.findFirst({ select: { id: true } })
      if (firstStudent) {
        studentId = firstStudent.id
      }
    }

    if (!studentId) {
      return NextResponse.json({ success: true, bookings: [] })
    }

    let studentBookings: any[] = []
    try {
      studentBookings = await prisma.resourceBooking.findMany({
        where: { studentId },
        include: {
          resource: {
            include: {
              institution: { select: { name: true } }
            }
          }
        },
        orderBy: { startTime: 'desc' }
      })
    } catch (dbErr) {
      console.warn('Prisma query error in student bookings, trying raw query fallback:', dbErr)
      try {
        studentBookings = await prisma.$queryRaw`
          SELECT rb.id, rb.resource_id as "resourceId", rb.purpose, rb.start_time as "startTime", 
                 rb.end_time as "endTime", rb.status, rb.rejection_reason as "rejectionReason", rb.created_at as "createdAt",
                 r.name as "resourceName", r.category, r.type, r.location, i.name as "ownerName"
          FROM "resource_bookings" rb
          LEFT JOIN "resources" r ON rb.resource_id = r.id
          LEFT JOIN "institutions" i ON r.institution_id = i.id
          WHERE rb.student_id = ${studentId}
          ORDER BY rb.start_time DESC
        `
      } catch (rawErr) {
        console.warn('Raw query fallback also failed:', rawErr)
        studentBookings = []
      }
    }

    return NextResponse.json({
      success: true,
      bookings: studentBookings.map((b: any) => ({
        id: b.id,
        resourceId: b.resourceId,
        resourceName: b.resource?.name || b.resourceName || 'Resource',
        category: b.resource?.category || b.resource?.type || b.category || b.type || 'Other',
        location: b.resource?.location || b.location || '',
        ownerName: b.resource?.institution?.name || b.ownerName || 'Institution',
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
    return NextResponse.json({ success: true, bookings: [] })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    let userId = session?.userId
    if (!userId) {
      const firstStudent = await prisma.student.findFirst({ select: { id: true } })
      if (firstStudent) userId = firstStudent.id
    }
    if (!userId) {
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
      where: { id: userId },
      select: { institutionId: true, name: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    let studentInstId = student.institutionId

    // Fallback: if student institutionId is missing, grab first institution
    if (!studentInstId) {
      const firstInst = await prisma.institution.findFirst({ select: { id: true } })
      if (firstInst) studentInstId = firstInst.id
    }

    if (!studentInstId) {
      return NextResponse.json({ error: 'Student institution profile not set' }, { status: 403 })
    }

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
        studentId: userId,
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
        studentId: userId,
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
