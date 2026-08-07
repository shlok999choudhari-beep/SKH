import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'company') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: session.userId },
      select: { companyName: true }
    })
    
    // Get coding sessions stats
    const totalSessions = await prisma.codingSession.count({
      where: { companyId: session.userId }
    })

    const completedSessions = await prisma.codingSession.count({
      where: { 
        companyId: session.userId,
        score: { not: null }
      }
    })

    return NextResponse.json({
      companyName: company?.companyName || 'Company',
      totalApplicants: totalSessions,
      aiMatched: Math.round(totalSessions * 0.6),
      activeJobs: totalSessions,
      hiredThisMonth: completedSessions
    })
  } catch (error: any) {
    console.error('Company dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
