import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const applicationSchema = z.object({
  student_id: z.number(),
})

const updateStatusSchema = z.object({
  status: z.enum(['applied', 'selected', 'rejected', 'hired']),
  current_round_id: z.number().nullable().optional(),
  student_id: z.number()
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const driveId = parseInt(id, 10)
    
    if (isNaN(driveId)) {
      return NextResponse.json({ error: 'Invalid drive ID' }, { status: 400 })
    }

    const applications = await prisma.placementApplication.findMany({
      where: { driveId },
      include: {
        student: {
          select: { name: true, email: true, resumes: { orderBy: { createdAt: 'desc' }, take: 1, select: { filename: true } } }
        },
        currentRound: {
          select: { roundName: true }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })
    
    const mappedApplications = applications.map(a => ({
      ...a,
      student_name: a.student.name,
      student_email: a.student.email,
      resume_url: a.student.resumes[0]?.filename || null,
      round_name: a.currentRound?.roundName || null
    }))

    return NextResponse.json({ applications: mappedApplications })
  } catch (error: any) {
    console.error('Error fetching placement applications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const driveId = parseInt(id, 10)
    
    if (isNaN(driveId)) {
      return NextResponse.json({ error: 'Invalid drive ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = applicationSchema.parse(body)
    
    const result = await prisma.placementApplication.create({
      data: {
        driveId,
        studentId: validatedData.student_id
      }
    })

    return NextResponse.json({ 
      success: true, 
      applicationId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already applied to this drive' }, { status: 409 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error submitting placement application:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const driveId = parseInt(id, 10)
    
    if (isNaN(driveId)) {
      return NextResponse.json({ error: 'Invalid drive ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)
    
    const updateData: any = { status: validatedData.status }
    if (validatedData.current_round_id !== undefined) {
      updateData.currentRoundId = validatedData.current_round_id
    }

    const result = await prisma.placementApplication.updateMany({
      where: {
        driveId,
        studentId: validatedData.student_id
      },
      data: updateData
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error updating application status:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
