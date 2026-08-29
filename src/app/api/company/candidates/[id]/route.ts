import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getMasterCandidateProfile } from '@/lib/candidateIntelligenceService'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const studentId = parseInt(resolvedParams.id)
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid candidate ID' }, { status: 400 })
    }

    const session = await getSession()
    const companyId = session?.role === 'company' ? session.userId : 1

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'Software Developer'
    const skillsParam = searchParams.get('requiredSkills')
    const requiredSkills = skillsParam ? skillsParam.split(',').map(s => s.trim()).filter(Boolean) : undefined

    const profile = await getMasterCandidateProfile(studentId, {
      role,
      requiredSkills,
      companyId
    })

    if (!profile) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profile
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error: any) {
    console.error('Candidate master profile API error:', error)
    return NextResponse.json({ error: 'Failed to fetch master candidate profile', details: error.message }, { status: 500 })
  }
}
