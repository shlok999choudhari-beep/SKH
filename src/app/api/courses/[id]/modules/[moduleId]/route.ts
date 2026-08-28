import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  orderIndex: z.number().optional()
})

// PATCH /api/courses/[id]/modules/[moduleId] - Update module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    const moduleId = parseInt(resolvedParams.moduleId, 10)

    if (isNaN(courseId) || isNaN(moduleId)) {
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
    const validated = updateModuleSchema.parse(body)

    const updated = await prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.orderIndex !== undefined && { orderIndex: validated.orderIndex })
      }
    })

    return NextResponse.json({ success: true, module: updated })
  } catch (error: any) {
    console.error('Error updating module:', error)
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
  }
}

// DELETE /api/courses/[id]/modules/[moduleId] - Delete module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    const moduleId = parseInt(resolvedParams.moduleId, 10)

    if (isNaN(courseId) || isNaN(moduleId)) {
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

    await prisma.courseModule.delete({
      where: { id: moduleId }
    })

    return NextResponse.json({ success: true, message: 'Module deleted' })
  } catch (error: any) {
    console.error('Error deleting module:', error)
    return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 })
  }
}
