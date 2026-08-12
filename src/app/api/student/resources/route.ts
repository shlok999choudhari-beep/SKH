import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Retrieve student details
    const student = await prisma.student.findUnique({
      where: { id: session.userId },
      select: { institutionId: true, college: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    let instId = student.institutionId

    // Self-healing: if institutionId is null but college name matches an existing Institution, link them!
    if (!instId && student.college) {
      const matchedInst = await prisma.institution.findFirst({
        where: {
          name: {
            equals: student.college.trim(),
            mode: 'insensitive'
          }
        }
      })
      if (matchedInst) {
        instId = matchedInst.id
      }
    }

    // Fallback: if there is only one institution in the database, associate the student with it
    if (!instId) {
      const institutions = await prisma.institution.findMany()
      if (institutions.length === 1) {
        instId = institutions[0].id
      }
    }

    if (!student.institutionId && instId) {
      // Persist the link in the database
      await prisma.student.update({
        where: { id: session.userId },
        data: { institutionId: instId }
      })
    }

    // If still no institution link is found, return empty results
    if (!instId) {
      return NextResponse.json({
        resources: [],
        stats: { availableCount: 0, sharedCount: 0, labsCount: 0, facilitiesCount: 0 }
      })
    }

    const now = new Date()

    // 1. Fetch owned resources where availableToStudents = true
    const ownedResources = await prisma.resource.findMany({
      where: {
        institutionId: instId,
        availableToStudents: true
      },
      include: {
        institution: { select: { name: true } },
        bookings: {
          where: {
            status: { not: 'cancelled' }
          },
          include: {
            bookedByUser: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 2. Fetch approved sharing agreements where requestingInstitutionId = student.institutionId
    const agreements = await prisma.sharingAgreement.findMany({
      where: {
        requestingInstitutionId: instId,
        status: 'active'
      },
      include: {
        ownerInstitution: { select: { name: true } },
        resource: {
          include: {
            institution: { select: { name: true } },
            bookings: {
              where: {
                status: { not: 'cancelled' }
              },
              include: {
                bookedByUser: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 3. Map owned resources
    const mappedOwned = ownedResources.map((res: any) => {
      const activeBooking = res.bookings.find((b: any) => {
        const start = new Date(b.startTime)
        const end = new Date(b.endTime)
        return start <= now && end >= now
      })

      const currentStatus = activeBooking ? 'FULLY_BOOKED' : res.status

      return {
        id: res.id,
        name: res.name,
        category: res.category || res.type || 'Other',
        description: res.description || '',
        location: res.location || '',
        capacity: res.capacity,
        availability: res.availability || 'N/A',
        facilities: res.facilities || '',
        status: currentStatus,
        sharingEnabled: res.sharingEnabled,
        availableToStudents: res.availableToStudents,
        institutionName: res.institution?.name,
        accessType: 'OWN_INSTITUTION',
        ownerName: res.institution?.name,
        bookings: res.bookings.map((b: any) => ({
          id: b.id,
          purpose: b.purpose,
          startTime: b.startTime,
          endTime: b.endTime,
          booked_by_name: b.bookedByUser?.name
        }))
      }
    })

    // 4. Map shared resources (must also be availableToStudents = true)
    const mappedShared = agreements
      .filter((agr: any) => agr.resource !== null && agr.resource.availableToStudents === true)
      .map((agr: any) => {
        const res = agr.resource
        const activeBooking = res.bookings.find((b: any) => {
          const start = new Date(b.startTime)
          const end = new Date(b.endTime)
          return start <= now && end >= now
        })

        const currentStatus = activeBooking ? 'FULLY_BOOKED' : res.status

        return {
          id: res.id,
          name: res.name,
          category: res.category || res.type || 'Other',
          description: res.description || '',
          location: res.location || '',
          capacity: res.capacity,
          availability: res.availability || 'N/A',
          facilities: res.facilities || '',
          status: currentStatus,
          sharingEnabled: res.sharingEnabled,
          availableToStudents: res.availableToStudents,
          institutionName: res.institution?.name,
          accessType: 'SHARED_RESOURCE',
          ownerName: agr.ownerInstitution?.name || res.institution?.name,
          bookings: res.bookings.map((b: any) => ({
            id: b.id,
            purpose: b.purpose,
            startTime: b.startTime,
            endTime: b.endTime,
            booked_by_name: b.bookedByUser?.name
          }))
        }
      })

    // 5. Combine results and remove duplicates (by resource ID)
    const resourceMap = new Map<number, any>()
    mappedOwned.forEach(r => resourceMap.set(r.id, r))
    mappedShared.forEach(r => {
      // If resource is somehow in both, shared status overrides or we just keep the owned one
      if (!resourceMap.has(r.id)) {
        resourceMap.set(r.id, r)
      }
    })

    const combinedResources = Array.from(resourceMap.values())

    // 6. Compute stats based on the exact dynamic list
    const availableCount = combinedResources.filter(r => r.status === 'AVAILABLE' || r.status === 'active' || r.status === 'ACTIVE').length
    const sharedCount = combinedResources.filter(r => r.accessType === 'SHARED_RESOURCE').length
    const labsCount = combinedResources.filter(r => r.category.toLowerCase().includes('lab')).length
    const facilitiesCount = combinedResources.filter(r => {
      const cat = r.category.toLowerCase()
      return cat.includes('training') || cat.includes('facilit') || cat.includes('hall') || cat.includes('classroom')
    }).length

    return NextResponse.json({
      resources: combinedResources,
      stats: {
        availableCount,
        sharedCount,
        labsCount,
        facilitiesCount
      }
    })

  } catch (error: any) {
    console.error('Error fetching student campus resources:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
