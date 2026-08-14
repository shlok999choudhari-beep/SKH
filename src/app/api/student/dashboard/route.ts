import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parallelize all dashboard metric queries
    const [student, resumeStatsRaw, skillCount, codingSessionsRaw] = await Promise.all([
      prisma.student.findUnique({
        where: { id: session.userId },
        select: { name: true }
      }),
      prisma.resume.aggregate({
        where: { studentId: session.userId },
        _avg: { atsScore: true },
        _count: { _all: true }
      }),
      prisma.skillAssessment.count({
        where: { studentId: session.userId }
      }),
      prisma.codingSession.aggregate({
        where: { studentId: session.userId },
        _avg: { score: true },
        _count: { _all: true }
      })
    ])

    const avgAts = resumeStatsRaw._avg.atsScore || 0
    const avgScore = codingSessionsRaw._avg.score || 0

    return NextResponse.json({
      name: student?.name || 'Student',
      atsScore: Math.round(avgAts),
      skillMatch: skillCount,
      jobsMatched: 24, // Static for now
      profileScore: Math.round(avgAts * 0.8 + avgScore * 0.2)
    })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
