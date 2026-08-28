import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateQuizQuestions } from '@/lib/lmsAiService'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    const body = await req.json()
    const { courseId = 1, topic = 'Core Principles', difficulty = 'Intermediate', questionCount = 3 } = body

    const cId = parseInt(courseId.toString(), 10)
    const count = Math.min(Math.max(parseInt(questionCount.toString(), 10) || 3, 1), 10)

    const questions = await generateQuizQuestions({
      courseId: cId,
      topic,
      difficulty,
      questionCount: count,
      questionTypes: 'mixed'
    })

    return NextResponse.json({
      success: true,
      topic,
      difficulty,
      questions
    })
  } catch (error: any) {
    console.error('[API AI Practice Error]:', error)
    return NextResponse.json({ error: 'Failed to generate practice test', details: error.message }, { status: 500 })
  }
}
