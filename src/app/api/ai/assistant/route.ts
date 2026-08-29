import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { askCourseAssistant } from '@/lib/lmsAiService'
import { validateLearningScope, BLOCKED_SCOPE_MESSAGE } from '@/lib/learningScopeGuard'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(req.url)
    const courseIdParam = searchParams.get('courseId')
    const conversationIdParam = searchParams.get('conversationId')

    const courseId = courseIdParam ? parseInt(courseIdParam, 10) : undefined

    let validStudentId: number | undefined
    let validUserId: number | undefined

    if (session?.role === 'student' && session.userId) {
      const student = await prisma.student.findUnique({ where: { id: session.userId } })
      if (student) validStudentId = student.id
    } else if (session?.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } })
      if (user) validUserId = user.id
    }

    if (conversationIdParam) {
      const convId = parseInt(conversationIdParam, 10)
      const conversation = await prisma.aiConversation.findUnique({
        where: { id: convId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          },
          course: {
            select: { id: true, title: true }
          }
        }
      })
      return NextResponse.json({ success: true, conversation })
    }

    // List recent conversations
    const conversations = await prisma.aiConversation.findMany({
      where: {
        ...(validStudentId ? { studentId: validStudentId } : validUserId ? { userId: validUserId } : {}),
        ...(courseId ? { courseId } : {})
      },
      include: {
        course: {
          select: { id: true, title: true }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })

    return NextResponse.json({ success: true, conversations })
  } catch (error: any) {
    console.error('[API AI Assistant GET Error]:', error)
    return NextResponse.json({ error: 'Failed to retrieve AI conversations', details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const body = await req.json()
    const { courseId, moduleId, lessonId, query, conversationId } = body

    if (!courseId || !query?.trim()) {
      return NextResponse.json({ error: 'courseId and query are required' }, { status: 400 })
    }

    const cleanQuery = query.trim()

    // ── Centralized LearningScopeGuard Validation ──
    const scopeCheck = await validateLearningScope(cleanQuery)
    if (!scopeCheck.allowed) {
      return NextResponse.json({
        success: true,
        blocked: true,
        answer: scopeCheck.blockedMessage || BLOCKED_SCOPE_MESSAGE,
        sources: [],
        provider: 'fallback_engine'
      })
    }

    const cId = parseInt(courseId.toString(), 10)

    let validStudentId: number | null = null
    let validUserId: number | null = null

    if (session?.role === 'student' && session.userId) {
      const student = await prisma.student.findUnique({ where: { id: session.userId } })
      if (student) validStudentId = student.id
    } else if (session?.userId) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } })
      if (user) validUserId = user.id
    }

    // 1. Find or create AI Conversation
    let activeConversation: any = null
    if (conversationId) {
      try {
        activeConversation = await prisma.aiConversation.findUnique({
          where: { id: parseInt(conversationId.toString(), 10) },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 6
            }
          }
        })
      } catch (err) {
        console.warn('[AI Assistant] Conversation lookup warning:', err)
      }
    }

    if (!activeConversation) {
      try {
        activeConversation = await prisma.aiConversation.create({
          data: {
            courseId: cId,
            studentId: validStudentId,
            userId: validUserId,
            moduleId: moduleId ? parseInt(moduleId.toString(), 10) : null,
            lessonId: lessonId ? parseInt(lessonId.toString(), 10) : null,
            title: query.trim().slice(0, 50) + (query.length > 50 ? '...' : '')
          },
          include: {
            messages: true
          }
        })
      } catch (convErr) {
        console.warn('[AI Assistant] Conversation create warning:', convErr)
      }
    }

    // Format previous messages
    const history = (activeConversation?.messages || []).map((m: any) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content
    }))

    // 2. Query AI Assistant with grounded RAG
    const aiResult = await askCourseAssistant({
      courseId: cId,
      moduleId: moduleId ? parseInt(moduleId.toString(), 10) : null,
      lessonId: lessonId ? parseInt(lessonId.toString(), 10) : null,
      query: query.trim(),
      conversationHistory: history
    })

    // 3. Save User message and Assistant response if conversation exists
    let userMsgId: number | null = null
    let assistantMsgId: number | null = null

    if (activeConversation?.id) {
      try {
        const uMsg = await prisma.aiMessage.create({
          data: {
            conversationId: activeConversation.id,
            sender: 'user',
            content: query.trim(),
            tokensUsed: Math.ceil(query.length / 4)
          }
        })
        userMsgId = uMsg.id

        const aMsg = await prisma.aiMessage.create({
          data: {
            conversationId: activeConversation.id,
            sender: 'assistant',
            content: aiResult.answer,
            sources: JSON.stringify(aiResult.sources),
            tokensUsed: aiResult.tokensUsed
          }
        })
        assistantMsgId = aMsg.id

        await prisma.aiConversation.update({
          where: { id: activeConversation.id },
          data: { updatedAt: new Date() }
        })
      } catch (msgErr) {
        console.warn('[AI Assistant] Message persist warning:', msgErr)
      }
    }

    // Record AI usage metric safely
    if (validUserId || validStudentId) {
      try {
        await prisma.aiUsage.create({
          data: {
            userId: validUserId,
            studentId: validStudentId,
            feature: 'assistant',
            tokensUsed: aiResult.tokensUsed
          }
        })
      } catch (e) {
        // ignore metric log error
      }
    }

    return NextResponse.json({
      success: true,
      conversationId: activeConversation?.id || null,
      messageId: assistantMsgId,
      answer: aiResult.answer,
      sources: aiResult.sources,
      provider: aiResult.provider
    })
  } catch (error: any) {
    console.error('[API AI Assistant POST Error]:', error)
    return NextResponse.json({ error: 'Failed to process AI assistant request', details: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationIdParam = searchParams.get('conversationId')

    if (!conversationIdParam) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    const id = parseInt(conversationIdParam, 10)
    await prisma.aiConversation.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Conversation deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete conversation', details: error.message }, { status: 500 })
  }
}
