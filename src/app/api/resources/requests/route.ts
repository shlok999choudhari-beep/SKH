import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const createRequestSchema = z.object({
  resourceId: z.number(),
  purpose: z.string().min(2, 'Purpose is required'),
  requestedDate: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  studentCount: z.number().int().positive(),
  additionalRequirements: z.string().optional(),
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: 'Start time must be before end time',
  path: ['endTime']
})

async function checkAuth() {
  const session = await getSession()
  if (!session || session.role !== 'institution-admin') {
    return { error: 'Unauthorized', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { institutionId: true, id: true }
  })

  if (!user || !user.institutionId) {
    return { error: 'Institution not found', status: 404 }
  }

  return { institutionId: user.institutionId, userId: user.id }
}

export async function GET(request: Request) {
  try {
    const auth = await checkAuth()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'incoming' or 'outgoing'

    let whereClause: any = {}

    if (type === 'incoming') {
      // Requests where the resource belongs to the current institution
      whereClause.resource = {
        institutionId: auth.institutionId
      }
    } else if (type === 'outgoing') {
      // Requests made by the current institution
      whereClause.requestingInstitutionId = auth.institutionId
    } else {
      // Return both related to the current institution
      whereClause.OR = [
        { requestingInstitutionId: auth.institutionId },
        { resource: { institutionId: auth.institutionId } }
      ]
    }

    const requests = await prisma.resourceRequest.findMany({
      where: whereClause,
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            category: true,
            location: true,
            capacity: true,
            institution: { select: { name: true } }
          }
        },
        requestingInstitution: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error('Error fetching resource requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAuth()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const validatedData = createRequestSchema.parse(body)

    const resource = await prisma.resource.findUnique({
      where: { id: validatedData.resourceId },
      include: {
        institution: { select: { name: true } }
      }
    })

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    if (resource.institutionId === auth.institutionId) {
      return NextResponse.json({ error: 'Cannot request access to your own resource' }, { status: 400 })
    }

    if (!resource.sharingEnabled) {
      return NextResponse.json({ error: 'Resource is not available for sharing' }, { status: 400 })
    }

    const newStart = new Date(validatedData.startTime)
    const newEnd = new Date(validatedData.endTime)

    // Check for overlapping bookings
    const overlappingBooking = await prisma.resourceBooking.findFirst({
      where: {
        resourceId: validatedData.resourceId,
        status: { not: 'cancelled' },
        OR: [
          { startTime: { lte: newStart }, endTime: { gt: newStart } },
          { startTime: { lt: newEnd }, endTime: { gte: newEnd } },
          { startTime: { gte: newStart }, endTime: { lte: newEnd } }
        ]
      }
    })

    if (overlappingBooking) {
      return NextResponse.json({ error: 'This resource is already booked during the requested time.' }, { status: 409 })
    }

    // Check for overlapping approved requests
    const overlappingRequest = await prisma.resourceRequest.findFirst({
      where: {
        resourceId: validatedData.resourceId,
        status: 'approved',
        OR: [
          { startTime: { lte: newStart }, endTime: { gt: newStart } },
          { startTime: { lt: newEnd }, endTime: { gte: newEnd } },
          { startTime: { gte: newStart }, endTime: { lte: newEnd } }
        ]
      }
    })

    if (overlappingRequest) {
      return NextResponse.json({ error: 'This resource is already booked during the requested time.' }, { status: 409 })
    }

    // Create the resource request
    const result = await prisma.resourceRequest.create({
      data: {
        resourceId: validatedData.resourceId,
        requestingInstitutionId: auth.institutionId,
        purpose: validatedData.purpose,
        requestedDate: new Date(validatedData.requestedDate),
        startTime: newStart,
        endTime: newEnd,
        studentCount: validatedData.studentCount,
        additionalRequirements: validatedData.additionalRequirements || null,
        status: 'pending'
      }
    })

    // Fetch requesting institution details
    const reqInst = await prisma.institution.findUnique({
      where: { id: auth.institutionId },
      select: { name: true }
    })

    // Create notification for the owning institution
    await prisma.resourceSharingNotification.create({
      data: {
        institutionId: resource.institutionId,
        message: `${reqInst?.name || 'An institution'} requested access to ${resource.name}.`
      }
    })

    return NextResponse.json({
      success: true,
      requestId: result.id,
      message: 'Request Sent Successfully'
    }, { status: 201 })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error submitting resource request:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
