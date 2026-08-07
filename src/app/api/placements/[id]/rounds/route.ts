import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const roundSchema = z.object({
  round_name: z.string().min(2, 'Round name is required'),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  status: z.string().optional()
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

    const rounds = await prisma.placementRound.findMany({
      where: { driveId },
      orderBy: { id: 'asc' }
    })
    
    return NextResponse.json({ rounds })
  } catch (error: any) {
    console.error('Error fetching placement rounds:', error)
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
    const validatedData = roundSchema.parse(body)
    
    const result = await prisma.placementRound.create({
      data: {
        driveId,
        roundName: validatedData.round_name,
        startTime: validatedData.start_time ? new Date(validatedData.start_time) : null,
        endTime: validatedData.end_time ? new Date(validatedData.end_time) : null,
        status: validatedData.status || 'scheduled'
      }
    })

    return NextResponse.json({ 
      success: true, 
      roundId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating placement round:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
