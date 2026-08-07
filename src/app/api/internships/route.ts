import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const internshipSchema = z.object({
  institution_id: z.number(),
  company_id: z.number().optional(),
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  location: z.string().optional(),
  stipend: z.string().optional(),
  duration: z.string().optional(),
  deadline: z.string().optional(),
  status: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')

    let whereClause = {}
    if (institutionId) {
      whereClause = { institutionId: parseInt(institutionId, 10) }
    }

    const internships = await prisma.internship.findMany({
      where: whereClause,
      include: {
        company: {
          select: { companyName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const mappedInternships = internships.map(i => ({
      ...i,
      company_name: i.company?.companyName || null
    }))

    return NextResponse.json({ internships: mappedInternships })
  } catch (error: any) {
    console.error('Error fetching internships:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = internshipSchema.parse(body)
    
    const result = await prisma.internship.create({
      data: {
        institutionId: validatedData.institution_id,
        companyId: validatedData.company_id || null,
        title: validatedData.title,
        description: validatedData.description,
        location: validatedData.location || null,
        stipend: validatedData.stipend || null,
        duration: validatedData.duration || null,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        status: validatedData.status || 'open'
      }
    })

    return NextResponse.json({ 
      success: true, 
      internshipId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating internship:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
