import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Generate random uppercase alphanumeric code
function generateCode(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O,0,I,1 (confusable)
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// POST /api/trainer/courses/[id]/join-code — generate or regenerate join code
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'trainer' || !session.userId) {
      return NextResponse.json({ error: 'Trainer login required' }, { status: 401 })
    }

    const { id } = await params
    const courseId = parseInt(id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    // Ensure trainer owns this course
    const course = await prisma.course.findFirst({
      where: { id: courseId, trainerId: session.userId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found or you do not own it.' }, { status: 404 })
    }

    // Generate unique code (retry if collision)
    let code = generateCode()
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.course.findUnique({ where: { joinCode: code } })
      if (!existing || existing.id === courseId) break
      code = generateCode()
      attempts++
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { joinCode: code, joinCodeEnabled: true }
    })

    return NextResponse.json({ success: true, joinCode: updated.joinCode })
  } catch (err: any) {
    console.error('Generate join code error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/trainer/courses/[id]/join-code — toggle enabled/disabled
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'trainer' || !session.userId) {
      return NextResponse.json({ error: 'Trainer login required' }, { status: 401 })
    }

    const { id } = await params
    const courseId = parseInt(id, 10)
    const body = await req.json()
    const enabled = Boolean(body.enabled)

    const course = await prisma.course.findFirst({
      where: { id: courseId, trainerId: session.userId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { joinCodeEnabled: enabled }
    })

    return NextResponse.json({ success: true, joinCodeEnabled: updated.joinCodeEnabled })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
