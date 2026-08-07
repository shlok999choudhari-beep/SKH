import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sessionSchema = z.object({
  student_id: z.number().optional(),
  start_time: z.string().datetime({ message: 'Invalid start_time format' }),
  end_time: z.string().datetime({ message: 'Invalid end_time format' }),
  notes: z.string().optional(),
}).refine(data => new Date(data.start_time) < new Date(data.end_time), {
  message: 'start_time must be before end_time',
  path: ['end_time']
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const trainerId = parseInt(id, 10)
    
    if (isNaN(trainerId)) {
      return NextResponse.json({ error: 'Invalid trainer ID' }, { status: 400 })
    }

    const sessions = await prisma.trainerSession.findMany({
      where: { trainerId },
      include: {
        student: {
          select: { name: true }
        }
      },
      orderBy: { startTime: 'asc' }
    })
    
    const mappedSessions = sessions.map(ts => ({
      ...ts,
      student_name: ts.student?.name || null
    }))

    return NextResponse.json({ sessions: mappedSessions })
  } catch (error: any) {
    console.error('Error fetching trainer sessions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const trainerId = parseInt(id, 10)
    
    if (isNaN(trainerId)) {
      return NextResponse.json({ error: 'Invalid trainer ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = sessionSchema.parse(body)
    
    const startTime = new Date(validatedData.start_time)
    const endTime = new Date(validatedData.end_time)

    // Check for overlapping sessions
    const overlapping = await prisma.trainerSession.findFirst({
      where: {
        trainerId,
        status: { not: 'cancelled' },
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } }
        ]
      }
    })

    if (overlapping) {
      return NextResponse.json({ error: 'Trainer is already booked for this time slot' }, { status: 409 })
    }

    const result = await prisma.trainerSession.create({
      data: {
        trainerId,
        studentId: validatedData.student_id || null,
        startTime,
        endTime,
        notes: validatedData.notes || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      sessionId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating trainer session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
