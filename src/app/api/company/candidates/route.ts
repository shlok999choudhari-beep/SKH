import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { evaluateCandidatesForRequirement, CandidateFilterCriteria } from '@/lib/candidateIntelligenceService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const companyId = session?.role === 'company' ? session.userId : 1

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'Software Developer'
    const skillsParam = searchParams.get('requiredSkills')
    const requiredSkills = skillsParam ? skillsParam.split(',').map(s => s.trim()).filter(Boolean) : undefined

    const branch = searchParams.get('branch') || undefined
    const degree = searchParams.get('degree') || undefined
    const minCgpa = searchParams.get('minCgpa') ? parseFloat(searchParams.get('minCgpa')!) : undefined
    const minTenth = searchParams.get('minTenth') ? parseFloat(searchParams.get('minTenth')!) : undefined
    const minTwelfth = searchParams.get('minTwelfth') ? parseFloat(searchParams.get('minTwelfth')!) : undefined
    const graduationYear = searchParams.get('graduationYear')
      ? searchParams.get('graduationYear') === 'all'
        ? 'all'
        : parseInt(searchParams.get('graduationYear')!)
      : undefined
    const minInternships = searchParams.get('minInternships') ? parseInt(searchParams.get('minInternships')!) : undefined
    const hasProjects = searchParams.get('hasProjects') === 'true'
    const hasAssessments = searchParams.get('hasAssessments') === 'true'
    const topLimitParam = searchParams.get('topLimit')
    const topLimit = topLimitParam === 'all' ? 'all' : topLimitParam ? parseInt(topLimitParam) : 10
    const sortBy = (searchParams.get('sortBy') as any) || 'match'
    const search = searchParams.get('search') || undefined

    const filters: CandidateFilterCriteria = {
      role,
      requiredSkills,
      branch,
      degree,
      minCgpa,
      minTenth,
      minTwelfth,
      graduationYear,
      minInternships,
      hasProjects,
      hasAssessments,
      topLimit,
      sortBy,
      search
    }

    const result = await evaluateCandidatesForRequirement(filters, companyId)

    return NextResponse.json({
      success: true,
      role,
      filters,
      candidates: result.candidates,
      ineligibleCandidates: result.ineligibleCandidates,
      totalEligible: result.totalEligible,
      totalCandidates: result.totalCandidates,
      hasHighMatches: result.hasHighMatches,
      scoringWeights: result.scoringWeights,
      summary: result.summary
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error: any) {
    console.error('Candidate discovery API error:', error)
    return NextResponse.json({ error: 'Failed to evaluate candidates', details: error.message }, { status: 500 })
  }
}
