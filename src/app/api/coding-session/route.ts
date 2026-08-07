import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { studentId } = await request.json()
    
    const roomId = randomBytes(16).toString('hex')
    
    await prisma.codingSession.create({
      data: {
        companyId: session.userId,
        studentId: studentId,
        roomId: roomId,
        status: 'active'
      }
    })

    return NextResponse.json({ success: true, roomId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const whereClause = session.role === 'student' 
      ? { studentId: session.userId } 
      : { companyId: session.userId }

    const sessions = await prisma.codingSession.findMany({
      where: whereClause,
      include: {
        student: { select: { name: true } },
        company: { select: { companyName: true } }
      },
      orderBy: { startedAt: 'desc' }
    })
    
    const mappedSessions = sessions.map(cs => ({
      ...cs,
      student_name: cs.student?.name || null,
      company_name: cs.company?.companyName || null,
      room_id: cs.roomId,
      started_at: cs.startedAt,
      ended_at: cs.endedAt,
      code_snapshot: cs.codeSnapshot
    }))

    return NextResponse.json({ sessions: mappedSessions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, score, feedback, codeSnapshot, language } = await request.json()
    
    await prisma.codingSession.updateMany({
      where: {
        roomId: roomId,
        companyId: session.userId
      },
      data: {
        status: 'completed',
        score: score,
        feedback: feedback,
        codeSnapshot: codeSnapshot,
        language: language,
        endedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
