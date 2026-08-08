import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const applicationSchema = z.object({
  student_id: z.coerce.number(),
})

const updateStatusSchema = z.object({
  status: z.string(),
  student_id: z.coerce.number()
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

    const applications: any[] = await prisma.$queryRaw`
      SELECT a.*, s.name as student_name, s.email as student_email, s.degree, s.cgpa
      FROM "internship_applications" a
      LEFT JOIN "students" s ON a.student_id = s.id
      WHERE a.internship_id = ${internshipId}
      ORDER BY a.applied_at DESC
    `

    const mappedApplications = applications.map(a => ({
      id: a.id,
      internship_id: a.internship_id,
      student_id: a.student_id,
      status: a.status || 'offered',
      appliedAt: a.applied_at,
      student_name: a.student_name || 'Student Applicant',
      student_email: a.student_email || 'student@demo.edu',
      degree: a.degree || 'B.Tech',
      cgpa: a.cgpa ? Number(a.cgpa) : null
    }))

    return NextResponse.json({ applications: mappedApplications }, { headers: { 'Cache-Control': 'no-store' } })
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
    
    const insertRes: any[] = await prisma.$queryRaw`
      INSERT INTO "internship_applications" ("internship_id", "student_id", "status")
      VALUES (${internshipId}, ${validatedData.student_id}, 'offered')
      ON CONFLICT ("internship_id", "student_id")
      DO UPDATE SET "status" = EXCLUDED."status"
      RETURNING "id"
    `

    return NextResponse.json({ 
      success: true, 
      applicationId: insertRes[0]?.id || 1 
    }, { status: 201 })
    
  } catch (error: any) {
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
    
    // UPSERT application stage status directly in PostgreSQL database
    await prisma.$executeRaw`
      INSERT INTO "internship_applications" ("internship_id", "student_id", "status")
      VALUES (${internshipId}, ${validatedData.student_id}, ${validatedData.status})
      ON CONFLICT ("internship_id", "student_id")
      DO UPDATE SET "status" = ${validatedData.status}
    `

    return NextResponse.json({ success: true, message: 'Application stage updated successfully' })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error updating application status:', error)
    return NextResponse.json({ error: 'Internal Server Error', message: error?.message }, { status: 500 })
  }
}
