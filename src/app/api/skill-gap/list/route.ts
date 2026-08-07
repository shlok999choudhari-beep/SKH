import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analyses = await prisma.skillGapAnalysis.findMany({
      where: { studentId: session.userId },
      select: {
        id: true,
        resumeName: true,
        jobDescName: true,
        analysisData: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Map properties to expected JSON format
    const mappedAnalyses = analyses.map(a => ({
      ...a,
      resume_name: a.resumeName,
      job_desc_name: a.jobDescName,
      analysis_data: a.analysisData,
      created_at: a.createdAt
    }))

    return NextResponse.json({ analyses: mappedAnalyses })
  } catch (error: any) {
    console.error('Error fetching analyses:', error)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }
}
