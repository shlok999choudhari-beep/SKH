import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await prisma.codingSession.findMany({
      where: {
        status: 'active',
        endedAt: null,
        company: {
          isOnline: 1
        }
      },
      include: {
        company: {
          select: { companyName: true, isOnline: true }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 20
    })

    const mappedRooms = rooms.map((r: any) => ({
      room_id: r.roomId,
      started_at: r.startedAt,
      company_name: r.company?.companyName || null,
      is_online: r.company?.isOnline ? 1 : 0
    }))

    return NextResponse.json({ rooms: mappedRooms })
  } catch (error: any) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}
