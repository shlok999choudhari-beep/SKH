import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { detectStudentsNeedingAttention } from '@/lib/placementIntelligenceService'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    const records = await detectStudentsNeedingAttention(session?.institutionId || 1)

    return NextResponse.json({
      success: true,
      studentsNeedingAttention: records,
      totalCount: records.length
    })
  } catch (error: any) {
    console.error('[API At-Risk Students Error]:', error)
    return NextResponse.json({ error: 'Failed to retrieve at-risk students', details: error.message }, { status: 500 })
  }
}
