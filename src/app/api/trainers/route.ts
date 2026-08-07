import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const trainerSchema = z.object({
  user_id: z.number(),
  institution_id: z.number(),
  expertise_tags: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    
    let whereClause = {}
    if (institutionId) {
      whereClause = { institutionId: parseInt(institutionId, 10) }
    }

    const trainers = await prisma.trainer.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Map the output to flatten user properties so it matches the old sqlite flat output
    const mappedTrainers = trainers.map(t => ({
      ...t,
      name: t.user.name,
      email: t.user.email
    }))

    return NextResponse.json({ trainers: mappedTrainers })
  } catch (error: any) {
    console.error('Error fetching trainers:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = trainerSchema.parse(body)
    
    // Verify user exists and has correct role
    const user = await prisma.user.findUnique({
      where: { id: validatedData.user_id }
    })

    if (!user || user.institutionId !== validatedData.institution_id) {
      return NextResponse.json({ error: 'User not found in this institution' }, { status: 404 })
    }

    if (user.role !== 'trainer') {
      return NextResponse.json({ error: 'User role must be trainer' }, { status: 400 })
    }

    const result = await prisma.trainer.create({
      data: {
        userId: validatedData.user_id,
        institutionId: validatedData.institution_id,
        expertiseTags: validatedData.expertise_tags || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      trainerId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating trainer:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
