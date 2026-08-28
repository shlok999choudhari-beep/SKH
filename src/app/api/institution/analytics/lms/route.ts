import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getInstitutionLmsAnalytics } from '@/lib/placementIntelligenceService'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    const { searchParams } = new URL(req.url)

    const department = searchParams.get('department')
    const batch = searchParams.get('batch')
    const year = searchParams.get('year')
    const courseIdParam = searchParams.get('courseId')
    const trainerIdParam = searchParams.get('trainerId')
    const dateRange = searchParams.get('dateRange')

    const courseId = courseIdParam ? parseInt(courseIdParam, 10) : undefined
    const trainerId = trainerIdParam ? parseInt(trainerIdParam, 10) : undefined

    const analytics = await getInstitutionLmsAnalytics({
      institutionId: session?.institutionId || 1,
      department,
      batch,
      year,
      courseId,
      trainerId,
      dateRange
    })

    return NextResponse.json({
      success: true,
      ...analytics
    })
  } catch (error: any) {
    console.error('[API Institution LMS Analytics Error]:', error)
    return NextResponse.json({ error: 'Failed to retrieve institution LMS analytics', details: error.message }, { status: 500 })
  }
}
