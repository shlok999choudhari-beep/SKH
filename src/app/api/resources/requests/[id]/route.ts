import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const decisionSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
  rejectionReason: z.string().optional()
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const requestId = parseInt(id, 10)
    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
    }

    const auth = await checkAuth()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { action, rejectionReason } = decisionSchema.parse(body)

    // Fetch the request with resource details
    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            institutionId: true
          }
        },
        requestingInstitution: { select: { name: true } }
      }
    })

    if (!resourceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const currentStatus = resourceRequest.status.toLowerCase()

    // 1. Validate permissions
    if (action === 'cancel') {
      // Only requesting institution can cancel
      if (resourceRequest.requestingInstitutionId !== auth.institutionId) {
        return NextResponse.json({ error: 'Unauthorized: Only the requesting institution can cancel this request' }, { status: 403 })
      }
    } else {
      // approve/reject: Only the owner institution can action
      if (resourceRequest.resource.institutionId !== auth.institutionId) {
        return NextResponse.json({ error: 'Unauthorized: Only the resource owner can approve or reject this request' }, { status: 403 })
      }
    }

    // 2. State Machine Rules
    if (action === 'approve') {
      if (currentStatus !== 'pending') {
        return NextResponse.json({ error: `Cannot approve request with status '${resourceRequest.status}'` }, { status: 400 })
      }
    } else if (action === 'reject') {
      if (currentStatus !== 'pending') {
        return NextResponse.json({ error: `Cannot reject request with status '${resourceRequest.status}'` }, { status: 400 })
      }
    } else if (action === 'cancel') {
      if (currentStatus !== 'pending' && currentStatus !== 'approved') {
        return NextResponse.json({ error: `Cannot cancel request with status '${resourceRequest.status}'` }, { status: 400 })
      }
    }

    // 3. Process action
    if (action === 'approve') {
      const startTime = resourceRequest.startTime
      const endTime = resourceRequest.endTime

      // Double-booking check: Ensure no overlapping confirmed bookings exist
      const overlapping = await prisma.resourceBooking.findFirst({
        where: {
          resourceId: resourceRequest.resourceId,
          status: { not: 'cancelled' },
          OR: [
            { startTime: { lte: startTime }, endTime: { gt: startTime } },
            { startTime: { lt: endTime }, endTime: { gte: endTime } },
            { startTime: { gte: startTime }, endTime: { lte: endTime } }
          ]
        }
      })

      if (overlapping) {
        return NextResponse.json({ error: 'This resource is already booked during the requested time.' }, { status: 409 })
      }

      // Execute transaction for approval
      const result = await prisma.$transaction(async (tx: any) => {
        // A. Update request status to APPROVED
        const updatedRequest = await tx.resourceRequest.update({
          where: { id: requestId },
          data: { status: 'approved' }
        })

        // B. Create SharingAgreement
        const agreement = await tx.sharingAgreement.create({
          data: {
            resourceId: resourceRequest.resourceId,
            ownerInstitutionId: resourceRequest.resource.institutionId,
            requestingInstitutionId: resourceRequest.requestingInstitutionId,
            requestId: resourceRequest.id,
            startDate: startTime,
            endDate: endTime,
            status: 'active'
          }
        })

        // C. Create ResourceBooking
        const booking = await tx.resourceBooking.create({
          data: {
            resourceId: resourceRequest.resourceId,
            bookedByUserId: auth.userId, // User ID of approving user
            purpose: resourceRequest.purpose,
            startTime: startTime,
            endTime: endTime,
            status: 'confirmed'
          }
        })

        // D. Create notification for requesting institution
        const ownerInst = await tx.institution.findUnique({
          where: { id: resourceRequest.resource.institutionId },
          select: { name: true }
        })

        await tx.resourceSharingNotification.create({
          data: {
            institutionId: resourceRequest.requestingInstitutionId,
            message: `Your request for ${resourceRequest.resource.name} has been approved by ${ownerInst?.name || 'the owner institution'}.`
          }
        })

        return { updatedRequest, agreement, booking }
      })

      return NextResponse.json({
        success: true,
        message: 'Request approved successfully',
        data: result
      })

    } else if (action === 'reject') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
      }

      // Transaction for rejection
      const result = await prisma.$transaction(async (tx: any) => {
        const updatedRequest = await tx.resourceRequest.update({
          where: { id: requestId },
          data: {
            status: 'rejected',
            rejectionReason: rejectionReason
          }
        })

        const ownerInst = await tx.institution.findUnique({
          where: { id: resourceRequest.resource.institutionId },
          select: { name: true }
        })

        await tx.resourceSharingNotification.create({
          data: {
            institutionId: resourceRequest.requestingInstitutionId,
            message: `Your request for ${resourceRequest.resource.name} was rejected by ${ownerInst?.name || 'the owner institution'}. Reason: ${rejectionReason}`
          }
        })

        return updatedRequest
      })

      return NextResponse.json({
        success: true,
        message: 'Request rejected successfully',
        data: result
      })

    } else if (action === 'cancel') {
      // Transaction for cancellation
      const result = await prisma.$transaction(async (tx: any) => {
        // A. Update request status to CANCELLED
        const updatedRequest = await tx.resourceRequest.update({
          where: { id: requestId },
          data: { status: 'cancelled' }
        })

        // B. Cancel related sharing agreements if any
        await tx.sharingAgreement.updateMany({
          where: { requestId: resourceRequest.id },
          data: { status: 'cancelled' }
        })

        // C. Cancel related bookings if any
        // We look up bookings for this resource at this exact time booked by this request
        // To be safe, we find bookings that match resourceId, purpose (matching request purpose), and times
        await tx.resourceBooking.updateMany({
          where: {
            resourceId: resourceRequest.resourceId,
            purpose: resourceRequest.purpose,
            startTime: resourceRequest.startTime,
            endTime: resourceRequest.endTime,
            status: 'confirmed'
          },
          data: { status: 'cancelled' }
        })

        // D. Create notification for the owner institution
        await tx.resourceSharingNotification.create({
          data: {
            institutionId: resourceRequest.resource.institutionId,
            message: `The request for ${resourceRequest.resource.name} was cancelled by ${resourceRequest.requestingInstitution.name}.`
          }
        })

        return updatedRequest
      })

      return NextResponse.json({
        success: true,
        message: 'Request cancelled successfully',
        data: result
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error processing request decision:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
