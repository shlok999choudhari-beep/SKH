import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { extractAndVerifyStudentSkills } from '@/lib/placementIntelligenceService'

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

    const skills = await extractAndVerifyStudentSkills(studentId)

    return NextResponse.json({
      success: true,
      studentId,
      skills,
      totalSkills: skills.length
    })
  } catch (error: any) {
    console.error('[API Student Skills Error]:', error)
    return NextResponse.json({ error: 'Failed to retrieve verified skills', details: error.message }, { status: 500 })
  }
}
