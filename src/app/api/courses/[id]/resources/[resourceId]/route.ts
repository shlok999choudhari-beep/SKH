import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const updateResourceSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(['PDF', 'VIDEO', 'DOCUMENT', 'EXTERNAL']).optional(),
  url: z.string().optional(),
  fileSize: z.number().nullable().optional(),
  orderIndex: z.number().optional()
})

// PATCH /api/courses/[id]/resources/[resourceId] - Update resource
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    const resourceId = parseInt(resolvedParams.resourceId, 10)

    if (isNaN(courseId) || isNaN(resourceId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({ where: { userId: session.userId } })
      if (!trainerRecord || course.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const validated = updateResourceSchema.parse(body)

    const updated = await prisma.courseResource.update({
      where: { id: resourceId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.type && { type: validated.type }),
        ...(validated.url && { url: validated.url }),
        ...(validated.fileSize !== undefined && { fileSize: validated.fileSize }),
        ...(validated.orderIndex !== undefined && { orderIndex: validated.orderIndex })
      }
    })

    return NextResponse.json({ success: true, resource: updated })
  } catch (error: any) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
  }
}

// DELETE /api/courses/[id]/resources/[resourceId] - Delete resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    const resourceId = parseInt(resolvedParams.resourceId, 10)

    if (isNaN(courseId) || isNaN(resourceId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({ where: { userId: session.userId } })
      if (!trainerRecord || course.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    await prisma.courseResource.delete({
      where: { id: resourceId }
    })

    return NextResponse.json({ success: true, message: 'Resource deleted' })
  } catch (error: any) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
  }
}
