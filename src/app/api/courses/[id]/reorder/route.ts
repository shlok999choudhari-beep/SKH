import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const body = await request.json()
    const { type, items } = body // items: array of { id: number, orderIndex: number }

    if (!type || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Type and items array required' }, { status: 400 })
    }

    if (type === 'sections') {
      for (const item of items) {
        await prisma.courseModule.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        })
      }
    } else if (type === 'resources') {
      for (const item of items) {
        await prisma.courseResource.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        })
      }
    } else if (type === 'assignments') {
      for (const item of items) {
        await prisma.assignment.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Order persisted successfully' })
  } catch (err: any) {
    console.error('Error reordering items:', err)
    return NextResponse.json({ error: 'Failed to reorder items', details: err.message }, { status: 500 })
  }
}
