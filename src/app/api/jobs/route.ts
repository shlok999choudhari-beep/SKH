import { NextRequest, NextResponse } from 'next/server'
import { validateLearningScope, JOBS_BLOCKED_SCOPE_MESSAGE } from '@/lib/learningScopeGuard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const linkedIn = require('linkedin-jobs-api')

export async function POST(req: NextRequest) {
  try {
    const { keyword, location } = await req.json()

    // Enforce LearningScopeGuard on job searches
    if (keyword && keyword.trim()) {
      const scopeCheck = await validateLearningScope(keyword.trim(), { mode: 'jobs' })
      if (!scopeCheck.allowed) {
        return NextResponse.json({
          jobs: [],
          blocked: true,
          message: scopeCheck.blockedMessage || JOBS_BLOCKED_SCOPE_MESSAGE,
          reason: scopeCheck.reason
        })
      }
    }

    const rawJobs = await linkedIn.query({
      keyword: keyword || 'intern',
      location: location || 'India',
      dateSincePosted: 'past Week',
      jobType: 'full time',
      remoteFilter: 'all',
      salary: '',
      experienceLevel: 'entry level',
      limit: '50'
    })

    // Filter any off-topic spam results from third-party provider
    const spamPatterns = /\b(casino|betting|gambling|lottery|dating|porn|movie download)\b/i
    const safeJobs = (rawJobs || []).filter((j: any) => {
      const title = j.position || ''
      const comp = j.company || ''
      return !spamPatterns.test(title) && !spamPatterns.test(comp)
    })

    return NextResponse.json({ jobs: safeJobs, blocked: false })
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json({ jobs: [], error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
