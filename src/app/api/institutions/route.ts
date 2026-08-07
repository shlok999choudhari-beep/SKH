import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const institutionSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  domain: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional(),
})

export async function GET() {
  try {
    const institutions = await prisma.institution.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ institutions })
  } catch (error: any) {
    console.error('Error fetching institutions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate with Zod
    const validatedData = institutionSchema.parse(body)
    
    // Check for existing domain if provided
    if (validatedData.domain) {
      const existing = await prisma.institution.findUnique({
        where: { domain: validatedData.domain }
      })
      if (existing) {
        return NextResponse.json({ error: 'Institution with this domain already exists' }, { status: 409 })
      }
    }

    const result = await prisma.institution.create({
      data: {
        name: validatedData.name,
        domain: validatedData.domain || null,
        contactEmail: validatedData.contact_email || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      institutionId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating institution:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
