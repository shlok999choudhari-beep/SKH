import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get institution ID
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { institutionId: true }
    })

    if (!user || !user.institutionId) {
      return NextResponse.json({ error: 'Institution profile not found' }, { status: 404 })
    }

    const instId = user.institutionId

    // Fetch resource bookings
    const bookings = await prisma.resourceBooking.findMany({
      where: {
        resource: { institutionId: instId }
      },
      include: {
        resource: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true
          }
        },
        bookedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Compute stats
    const now = new Date()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const pendingRequests = bookings.filter((b: any) => b.status === 'pending').length
    
    const approvedToday = bookings.filter((b: any) => {
      const isApproved = b.status === 'approved' || b.status === 'confirmed'
      const updatedToday = b.createdAt >= startOfToday // Simplification for demo
      return isApproved && updatedToday
    }).length

    const upcomingBookings = bookings.filter((b: any) => {
      const isApproved = b.status === 'approved' || b.status === 'confirmed'
      const isUpcoming = new Date(b.startTime) > now
      return isApproved && isUpcoming
    }).length

    const activeResources = await prisma.resource.count({
      where: {
        institutionId: instId,
        status: { in: ['active', 'AVAILABLE', 'ACTIVE'] }
      }
    })

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b: any) => ({
        id: b.id,
        resourceId: b.resourceId,
        resourceName: b.resource.name,
        category: b.resource.category || b.resource.type || 'Other',
        location: b.resource.location || '',
        purpose: b.purpose,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        rejectionReason: b.rejectionReason,
        createdAt: b.createdAt,
        requester: b.student
          ? { type: 'STUDENT', id: b.student.id, name: b.student.name, email: b.student.email, college: b.student.college }
          : { type: 'STAFF', id: b.bookedByUser?.id, name: b.bookedByUser?.name, email: b.bookedByUser?.email }
      })),
      stats: {
        pendingRequests,
        approvedToday,
        upcomingBookings,
        activeResources
      }
    })

  } catch (error: any) {
    console.error('Error fetching institution bookings:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
