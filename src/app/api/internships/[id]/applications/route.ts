import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const applicationSchema = z.object({
  student_id: z.number(),
})

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'shortlisted', 'accepted', 'rejected']),
  student_id: z.number()
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const internshipId = parseInt(id, 10)
    
    if (isNaN(internshipId)) {
      return NextResponse.json({ error: 'Invalid internship ID' }, { status: 400 })
    }

    const applications = await prisma.internshipApplication.findMany({
      where: { internshipId },
      include: {
        student: {
          select: { name: true, email: true, resumes: { orderBy: { createdAt: 'desc' }, take: 1, select: { filename: true } } }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })
    
    const mappedApplications = applications.map(a => ({
      ...a,
      student_name: a.student.name,
      student_email: a.student.email,
      resume_url: a.student.resumes[0]?.filename || null
    }))

    return NextResponse.json({ applications: mappedApplications })
  } catch (error: any) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const internshipId = parseInt(id, 10)
    
    if (isNaN(internshipId)) {
      return NextResponse.json({ error: 'Invalid internship ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = applicationSchema.parse(body)
    
    const result = await prisma.internshipApplication.create({
      data: {
        internshipId,
        studentId: validatedData.student_id
      }
    })

    return NextResponse.json({ 
      success: true, 
      applicationId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error.code === 'P2002') { // Prisma unique constraint error
      return NextResponse.json({ error: 'You have already applied to this internship' }, { status: 409 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error submitting application:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const internshipId = parseInt(id, 10)
    
    if (isNaN(internshipId)) {
      return NextResponse.json({ error: 'Invalid internship ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)
    
    const result = await prisma.internshipApplication.updateMany({
      where: {
        internshipId,
        studentId: validatedData.student_id
      },
      data: {
        status: validatedData.status
      }
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
