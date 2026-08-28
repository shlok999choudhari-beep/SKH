import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id, 10)

    const announcement = await prisma.courseAnnouncement.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        module: { select: { id: true, title: true } },
        author: { select: { id: true, name: true, role: true } }
      }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json({ announcement })
  } catch (err: any) {
    console.error('Error fetching announcement:', err)
    return NextResponse.json({ error: 'Failed to fetch announcement', details: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(resolvedParams.id, 10)
    const body = await req.json()

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.content !== undefined) data.content = body.content
    if (body.moduleId !== undefined) data.moduleId = body.moduleId ? parseInt(body.moduleId, 10) : null
    if (body.isPinned !== undefined) data.isPinned = !!body.isPinned
    if (body.status !== undefined) data.status = body.status

    const updated = await prisma.courseAnnouncement.update({
      where: { id },
      data
    })

    return NextResponse.json({ success: true, announcement: updated })
  } catch (err: any) {
    console.error('Error updating announcement:', err)
    return NextResponse.json({ error: 'Failed to update announcement', details: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(resolvedParams.id, 10)
    await prisma.courseAnnouncement.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Announcement deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting announcement:', err)
    return NextResponse.json({ error: 'Failed to delete announcement', details: err.message }, { status: 500 })
  }
}
