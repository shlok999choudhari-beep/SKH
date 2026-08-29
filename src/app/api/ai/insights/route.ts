import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { calculateStudentInsights } from '@/lib/lmsAiService'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(req.url)
    const courseIdParam = searchParams.get('courseId')

    let studentId = 1
    if (session?.role === 'student' && session.userId) {
      studentId = session.userId
    }

    const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null

    // Calculate real-time dynamic insights based on student quiz attempts and submissions
    const insights = await calculateStudentInsights(studentId, courseId)

    // Upsert into LearningInsight record for persistent tracking
    try {
      const existing = await prisma.learningInsight.findFirst({
        where: {
          studentId,
          ...(courseId ? { courseId } : {})
        }
      })

      if (existing) {
        await prisma.learningInsight.update({
          where: { id: existing.id },
          data: {
            strongTopics: JSON.stringify(insights.strongTopics),
            weakTopics: JSON.stringify(insights.weakTopics),
            recommendedActions: JSON.stringify(insights.recommendations),
            lastCalculatedAt: new Date()
          }
        })
      } else {
        await prisma.learningInsight.create({
          data: {
            studentId,
            courseId,
            strongTopics: JSON.stringify(insights.strongTopics),
            weakTopics: JSON.stringify(insights.weakTopics),
            recommendedActions: JSON.stringify(insights.recommendations)
          }
        })
      }
    } catch (dbErr) {
      console.warn('[LMS AI Insights] DB cache update warning:', dbErr)
    }

    return NextResponse.json({
      success: true,
      insights
    })
  } catch (error: any) {
    console.error('[API AI Insights Error]:', error)
    return NextResponse.json({ error: 'Failed to calculate learning insights', details: error.message }, { status: 500 })
  }
}
