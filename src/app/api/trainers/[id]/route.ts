import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const trainerId = parseInt(id, 10)

    if (isNaN(trainerId)) {
      return NextResponse.json({ error: 'Invalid trainer ID' }, { status: 400 })
    }

    const trainer = await prisma.trainer.findUnique({
      where: { id: trainerId }
    })

    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    await prisma.trainer.delete({
      where: { id: trainerId }
    })

    return NextResponse.json({ success: true, message: 'Trainer deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting trainer:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
