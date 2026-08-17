import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const driveSchema = z.object({
  institution_id: z.number(),
  company_id: z.number().optional(),
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  eligibility_criteria: z.string().optional(),
  status: z.enum(['upcoming', 'active', 'completed']).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')

    let whereClause = {}
    if (institutionId) {
      whereClause = { institutionId: parseInt(institutionId, 10) }
    }

    const drives = await prisma.placementDrive.findMany({
      where: whereClause,
      include: {
        company: {
          select: { companyName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const mappedDrives = drives.map((d: any) => ({
      ...d,
      company_name: d.company?.companyName || null
    }))

    return NextResponse.json({ drives: mappedDrives })
  } catch (error: any) {
    console.error('Error fetching placement drives:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = driveSchema.parse(body)
    
    const result = await prisma.placementDrive.create({
      data: {
        institutionId: validatedData.institution_id,
        companyId: validatedData.company_id || null,
        title: validatedData.title,
        description: validatedData.description,
        eligibilityCriteria: validatedData.eligibility_criteria || null,
        status: validatedData.status || 'upcoming'
      }
    })

    return NextResponse.json({ 
      success: true, 
      driveId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating placement drive:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
