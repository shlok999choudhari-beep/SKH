import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const certSchema = z.object({
  student_id: z.number(),
  institution_id: z.number(),
  name: z.string().min(2, 'Name is required'),
  provider: z.string().min(2, 'Provider is required'),
  issue_date: z.string().datetime({ message: 'Invalid issue_date format' }),
  credential_url: z.string().url('Invalid URL').optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    const studentId = searchParams.get('studentId')

    let whereClause = {}
    if (studentId) {
      whereClause = { studentId: parseInt(studentId, 10) }
    } else if (institutionId) {
      whereClause = { institutionId: parseInt(institutionId, 10) }
    }

    const certs = await prisma.certification.findMany({
      where: whereClause,
      include: {
        student: {
          select: { name: true }
        }
      },
      orderBy: { issueDate: 'desc' }
    })
    
    const mappedCerts = certs.map(c => ({
      ...c,
      student_name: c.student?.name || null
    }))

    return NextResponse.json({ certifications: mappedCerts })
  } catch (error: any) {
    console.error('Error fetching certifications:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = certSchema.parse(body)
    
    const result = await prisma.certification.create({
      data: {
        studentId: validatedData.student_id,
        institutionId: validatedData.institution_id,
        name: validatedData.name,
        provider: validatedData.provider,
        issueDate: new Date(validatedData.issue_date),
        credentialUrl: validatedData.credential_url || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      certificationId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error uploading certification:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
