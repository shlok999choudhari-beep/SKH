import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bookingSchema = z.object({
  booked_by_user_id: z.number(),
  purpose: z.string().optional(),
  start_time: z.string().datetime({ message: 'Invalid start_time format (ISO string required)' }),
  end_time: z.string().datetime({ message: 'Invalid end_time format (ISO string required)' }),
}).refine(data => new Date(data.start_time) < new Date(data.end_time), {
  message: 'start_time must be before end_time',
  path: ['end_time']
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resourceId = parseInt(id, 10)
    
    if (isNaN(resourceId)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 })
    }

    const bookings = await prisma.resourceBooking.findMany({
      where: { resourceId },
      include: {
        bookedByUser: {
          select: { name: true }
        },
        student: {
          select: { name: true }
        }
      },
      orderBy: { startTime: 'asc' }
    })
    
    const mappedBookings = bookings.map(b => ({
      ...b,
      booked_by_name: b.bookedByUser?.name || b.student?.name || 'Unknown User'
    }))

    return NextResponse.json({ bookings: mappedBookings })
  } catch (error: any) {
    console.error('Error fetching resource bookings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resourceId = parseInt(id, 10)
    
    if (isNaN(resourceId)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = bookingSchema.parse(body)
    
    const startTime = new Date(validatedData.start_time)
    const endTime = new Date(validatedData.end_time)

    // Check for overlapping bookings
    const overlapping = await prisma.resourceBooking.findFirst({
      where: {
        resourceId,
        status: { not: 'cancelled' },
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } }
        ]
      }
    })

    if (overlapping) {
      return NextResponse.json({ error: 'Resource is already booked for this time slot' }, { status: 409 })
    }

    const result = await prisma.resourceBooking.create({
      data: {
        resourceId,
        bookedByUserId: validatedData.booked_by_user_id,
        purpose: validatedData.purpose || null,
        startTime,
        endTime
      }
    })

    return NextResponse.json({ 
      success: true, 
      bookingId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating resource booking:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
