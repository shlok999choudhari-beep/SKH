import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
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
    const announcement = await prisma.courseAnnouncement.findUnique({
      where: { id }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const updated = await prisma.courseAnnouncement.update({
      where: { id },
      data: { isPinned: !announcement.isPinned }
    })

    return NextResponse.json({ success: true, isPinned: updated.isPinned })
  } catch (err: any) {
    console.error('Error toggling announcement pin:', err)
    return NextResponse.json({ error: 'Failed to toggle pin', details: err.message }, { status: 500 })
  }
}
