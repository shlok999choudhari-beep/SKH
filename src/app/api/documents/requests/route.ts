import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role === 'student') {
      const requests = await prisma.documentRequest.findMany({
        where: { studentId: session.userId },
        include: {
          institution: {
            select: { id: true, name: true }
          },
          document: {
            select: { id: true, fileName: true, verificationStatus: true }
          }
        },
        orderBy: { requestedAt: 'desc' }
      })
      return NextResponse.json({ success: true, requests })
    } else if (session.role === 'institution-admin') {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { institutionId: true }
      })
      if (!user || !user.institutionId) {
        return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
      }

      const requests = await prisma.documentRequest.findMany({
        where: { institutionId: user.institutionId },
        include: {
          student: {
            select: { id: true, name: true, email: true }
          },
          document: {
            select: { id: true, fileName: true, verificationStatus: true }
          }
        },
        orderBy: { requestedAt: 'desc' }
      })
      return NextResponse.json({ success: true, requests })
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch (error: any) {
    console.error('Fetch document requests error:', error)
    return NextResponse.json({ error: 'Failed to fetch document requests' }, { status: 500 })
  }
}
