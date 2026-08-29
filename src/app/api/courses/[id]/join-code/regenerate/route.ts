import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

function generateCourseCode(title: string): string {
  // Generate prefix from uppercase initials of title words or first 3 letters
  const words = title.trim().split(/\s+/).filter(Boolean)
  let prefix = ''
  if (words.length >= 2) {
    prefix = words.map(w => w[0].toUpperCase()).slice(0, 3).join('')
  } else if (words.length === 1) {
    prefix = words[0].slice(0, 3).toUpperCase()
  }
  if (!prefix || prefix.length < 2) prefix = 'CRS'

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // omit easily confused chars (0/O, 1/I)
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `${prefix}-${randomPart}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized. Only instructors can regenerate course codes.' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { trainer: true }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Role verification
    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (!trainerRecord || course.trainerId !== trainerRecord.id) {
        return NextResponse.json({ error: 'Forbidden. You do not own this course.' }, { status: 403 })
      }
    }

    let newCode = generateCourseCode(course.title)
    let exists = await prisma.course.findFirst({ where: { joinCode: newCode } })
    let attempts = 0
    while (exists && attempts < 5) {
      newCode = generateCourseCode(course.title)
      exists = await prisma.course.findFirst({ where: { joinCode: newCode } })
      attempts++
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        joinCode: newCode,
        joinCodeEnabled: true
      }
    })

    return NextResponse.json({
      success: true,
      joinCode: updated.joinCode,
      message: 'Course code successfully regenerated.'
    })
  } catch (err: any) {
    console.error('Error regenerating course code:', err)
    return NextResponse.json({ error: 'Failed to regenerate course code', details: err.message }, { status: 500 })
  }
}
