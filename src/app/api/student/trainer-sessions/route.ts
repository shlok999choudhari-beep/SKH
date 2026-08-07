import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentIdParam = searchParams.get('studentId')

    let studentId = studentIdParam ? parseInt(studentIdParam, 10) : undefined

    if (!studentId) {
      try {
        const session = await getSession()
        if (session && session.role === 'student' && session.userId) {
          studentId = session.userId
        }
      } catch (e) {
        console.error('Session get error:', e)
      }
    }

    let whereClause: any = {}
    if (studentId) {
      whereClause.studentId = studentId
    }

    const sessions = await prisma.trainerSession.findMany({
      where: { studentId },
      include: {
        trainer: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            institution: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    })

    const mapped = sessions.map(s => ({
      id: s.id,
      trainerId: s.trainerId,
      trainerName: s.trainer?.user?.name || 'Trainer',
      trainerEmail: s.trainer?.user?.email || '',
      trainerSpecialties: s.trainer?.expertiseTags || '',
      trainerSubjects: s.trainer?.subjects || '',
      institutionName: s.trainer?.institution?.name || '',
      startTime: s.startTime,
      endTime: s.endTime,
      notes: s.notes,
      status: s.status,
      createdAt: s.createdAt
    }))

    return NextResponse.json({ sessions: mapped })
  } catch (error: any) {
    console.error('Error fetching student trainer sessions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { sessionId, status } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const updated = await prisma.trainerSession.update({
      where: { id: parseInt(sessionId, 10) },
      data: { status: status || 'cancelled' }
    })

    return NextResponse.json({ success: true, session: updated })
  } catch (error: any) {
    console.error('Error updating session status:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
