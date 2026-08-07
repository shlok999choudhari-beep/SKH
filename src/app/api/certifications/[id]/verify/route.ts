import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const verifySchema = z.object({
  verified_status: z.enum(['pending', 'verified', 'rejected']),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const certificationId = parseInt(id, 10)
    
    if (isNaN(certificationId)) {
      return NextResponse.json({ error: 'Invalid certification ID' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = verifySchema.parse(body)
    
    try {
      await prisma.certification.update({
        where: { id: certificationId },
        data: { verifiedStatus: validatedData.verified_status }
      })
    } catch (e: any) {
      if (e.code === 'P2025') { // Record to update not found
        return NextResponse.json({ error: 'Certification not found' }, { status: 404 })
      }
      throw e;
    }

    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error verifying certification:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
