import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateQuizQuestions } from '@/lib/lmsAiService'
import { validateLearningScope, BLOCKED_SCOPE_MESSAGE } from '@/lib/learningScopeGuard'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { courseId = 1, topic = 'Core Principles', difficulty = 'Intermediate', questionCount = 3 } = body

    const cleanTopic = (topic || '').toString().trim()

    // ── Centralized LearningScopeGuard Validation ──
    const scopeCheck = await validateLearningScope(cleanTopic)
    if (!scopeCheck.allowed) {
      return NextResponse.json({
        success: false,
        blocked: true,
        error: scopeCheck.blockedMessage || BLOCKED_SCOPE_MESSAGE,
        message: scopeCheck.blockedMessage || BLOCKED_SCOPE_MESSAGE
      }, { status: 200 })
    }

    const cId = parseInt(courseId.toString(), 10)
    const count = Math.min(Math.max(parseInt(questionCount.toString(), 10) || 3, 1), 10)

    const questions = await generateQuizQuestions({
      courseId: cId,
      topic: cleanTopic,
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
