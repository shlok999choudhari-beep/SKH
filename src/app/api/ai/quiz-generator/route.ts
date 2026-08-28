import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateQuizQuestions } from '@/lib/lmsAiService'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    const body = await req.json()
    const { action } = body

    // 1. Action: Approve and Publish AI Draft Quiz to Course
    if (action === 'approve_and_publish') {
      const {
        courseId,
        moduleId,
        title,
        description,
        timeLimit = 20,
        passingScore = 60,
        questions
      } = body

      if (!courseId || !title || !Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json({ error: 'courseId, title, and questions are required' }, { status: 400 })
      }

      let trainerId: number | null = null
      if (session?.userId) {
        const trainer = await prisma.trainer.findFirst({
          where: { userId: session.userId }
        })
        if (trainer) trainerId = trainer.id
      }

      // Create official Quiz in database
      const quiz = await prisma.quiz.create({
        data: {
          courseId: parseInt(courseId.toString(), 10),
          moduleId: moduleId ? parseInt(moduleId.toString(), 10) : null,
          trainerId,
          title: title.trim(),
          description: description?.trim() || 'AI-generated and instructor-verified assessment.',
          timeLimit: parseInt(timeLimit.toString(), 10) || 20,
          passingScore: parseFloat(passingScore.toString()) || 60,
          status: 'published',
          questions: {
            create: questions.map((q: any, idx: number) => ({
              question: q.question,
              type: q.type || 'mcq',
              marks: q.marks || 1,
              explanation: q.explanation || '',
              orderIndex: idx,
              options: {
                create: (q.options || []).map((opt: any, optIdx: number) => ({
                  optionText: opt.optionText,
                  isCorrect: Boolean(opt.isCorrect),
                  orderIndex: optIdx
                }))
              }
            }))
          }
        },
        include: {
          questions: {
            include: { options: true }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'AI Draft Quiz approved and published successfully!',
        quiz
      })
    }

    // 2. Action: Regenerate a Single Question
    if (action === 'regenerate_single') {
      const { courseId, topic, difficulty = 'Intermediate', type = 'mcq' } = body
      const cId = parseInt((courseId || 1).toString(), 10)
      const freshQuestions = await generateQuizQuestions({
        courseId: cId,
        topic: topic || 'Core Principles',
        difficulty,
        questionCount: 1,
        questionTypes: type
      })

      return NextResponse.json({
        success: true,
        question: freshQuestions[0] || null
      })
    }

    // 3. Default Action: Generate Draft Questions
    const {
      courseId,
      moduleId,
      topic,
      difficulty = 'Intermediate',
      questionCount = 5,
      questionTypes = 'mixed'
    } = body

    if (!courseId || !topic?.trim()) {
      return NextResponse.json({ error: 'courseId and topic are required' }, { status: 400 })
    }

    const cId = parseInt(courseId.toString(), 10)
    const count = Math.min(Math.max(parseInt(questionCount.toString(), 10) || 5, 1), 15)

    const questions = await generateQuizQuestions({
      courseId: cId,
      moduleId: moduleId ? parseInt(moduleId.toString(), 10) : null,
      topic: topic.trim(),
      difficulty,
      questionCount: count,
      questionTypes
    })

    return NextResponse.json({
      success: true,
      topic: topic.trim(),
      difficulty,
      questionCount: questions.length,
      questions
    })
  } catch (error: any) {
    console.error('[API AI Quiz Generator Error]:', error)
    return NextResponse.json({ error: 'Failed to generate quiz questions', details: error.message }, { status: 500 })
  }
}
