import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const linkedIn = require('linkedin-jobs-api')

export async function POST(req: NextRequest) {
  try {
    const { keyword, location } = await req.json()

    const jobs = await linkedIn.query({
      keyword: keyword || 'intern',
      location: location || 'India',
      dateSincePosted: 'past Week',
      jobType: 'full time',
      remoteFilter: 'all',
      salary: '',
      experienceLevel: 'entry level',
      limit: '50'
    })

    return NextResponse.json({ jobs: jobs || [] })
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    return NextResponse.json({ jobs: [], error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
