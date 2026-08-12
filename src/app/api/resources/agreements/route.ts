import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

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

    const agreements = await prisma.sharingAgreement.findMany({
      where: {
        OR: [
          { ownerInstitutionId: auth.institutionId },
          { requestingInstitutionId: auth.institutionId }
        ]
      },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            category: true,
            location: true,
            capacity: true
          }
        },
        ownerInstitution: {
          select: { name: true }
        },
        requestingInstitution: {
          select: { name: true }
        },
        request: {
          select: {
            purpose: true,
            studentCount: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ agreements })
  } catch (error: any) {
    console.error('Error fetching sharing agreements:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
