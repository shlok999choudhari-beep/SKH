import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const sessionSchema = z.object({
  student_id: z.number().optional(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().optional(),
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
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
            degree: true,
            phone: true,
            graduationYear: true,
            githubUrl: true,
            linkedinUrl: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    })
    
    const mappedSessions = sessions.map((ts: any) => ({
      id: ts.id,
      trainerId: ts.trainerId,
      studentId: ts.studentId,
      student_name: ts.student?.name || 'Student',
      student_email: ts.student?.email || '',
      student_college: ts.student?.college || '',
      student_degree: ts.student?.degree || '',
      student_phone: ts.student?.phone || '',
      student_graduation: ts.student?.graduationYear || null,
      student_github: ts.student?.githubUrl || null,
      student_linkedin: ts.student?.linkedinUrl || null,
      startTime: ts.startTime,
      endTime: ts.endTime,
      notes: ts.notes,
      status: ts.status,
      createdAt: ts.createdAt
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

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end time format' }, { status: 400 })
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 })
    }

    let studentId = validatedData.student_id

    // Fallback to active logged-in student session
    if (!studentId) {
      try {
        const session = await getSession()
        if (session && session.role === 'student' && session.userId) {
          studentId = session.userId
        }
      } catch (e) {
        console.error('Session lookup error:', e)
      }
    }

    // Fallback to first student if still not found
    if (!studentId) {
      const defaultStudent = await prisma.student.findFirst()
      if (defaultStudent) {
        studentId = defaultStudent.id
      }
    }

    // Check for overlapping sessions for this trainer
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
      return NextResponse.json({ error: 'Trainer is already booked for this selected time slot' }, { status: 409 })
    }

    const result = await prisma.trainerSession.create({
      data: {
        trainerId,
        studentId: studentId || null,
        startTime,
        endTime,
        notes: validatedData.notes || '1-on-1 Mentorship Session',
        status: 'scheduled'
      },
      include: {
        student: {
          select: { name: true, email: true, college: true, degree: true, phone: true }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      session: {
        ...result,
        student_name: result.student?.name || 'Student',
        student_email: result.student?.email || '',
        student_college: result.student?.college || '',
        student_degree: result.student?.degree || '',
        student_phone: result.student?.phone || ''
      }
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating trainer session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


