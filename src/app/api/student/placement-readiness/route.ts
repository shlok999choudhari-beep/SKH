import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { calculatePlacementReadiness, matchInternshipsAndSkillGaps } from '@/lib/placementIntelligenceService'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    const { searchParams } = new URL(req.url)
    const studentIdParam = searchParams.get('studentId')

    let studentId = 1
    if (session?.role === 'student' && session.email) {
      const student = await prisma.student.findFirst({
        where: { email: session.email }
      })
      if (student) studentId = student.id
    } else if (studentIdParam && (session?.role === 'institution-admin' || session?.role === 'trainer')) {
      studentId = parseInt(studentIdParam, 10)
    }

    const [readiness, internshipMatches] = await Promise.all([
      calculatePlacementReadiness(studentId),
      matchInternshipsAndSkillGaps(studentId)
    ])

    return NextResponse.json({
      success: true,
      studentId,
      readiness,
      recommendedInternships: internshipMatches
    })
  } catch (error: any) {
    console.error('[API Student Placement Readiness Error]:', error)
    return NextResponse.json({ error: 'Failed to calculate placement readiness', details: error.message }, { status: 500 })
  }
}
