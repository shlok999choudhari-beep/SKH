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

    const notifications = await prisma.resourceSharingNotification.findMany({
      where: {
        institutionId: auth.institutionId
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ notifications })
  } catch (error: any) {
    console.error('Error fetching resource sharing notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await checkAuth()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Mark all as read
    await prisma.resourceSharingNotification.updateMany({
      where: {
        institutionId: auth.institutionId,
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({ success: true, message: 'All notifications marked as read' })
  } catch (error: any) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
