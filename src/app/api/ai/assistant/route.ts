import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { askCourseAssistant } from '@/lib/lmsAiService'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    const { searchParams } = new URL(req.url)
    const courseIdParam = searchParams.get('courseId')
    const conversationIdParam = searchParams.get('conversationId')

    const courseId = courseIdParam ? parseInt(courseIdParam, 10) : undefined

    let studentId: number | undefined
    if (session?.role === 'student' && session.userId) {
      const student = await prisma.student.findFirst({
        where: { email: session.email || '' }
      })
      if (student) studentId = student.id
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
        ...(studentId ? { studentId } : session?.userId ? { userId: session.userId } : {}),
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
    const session = await getSession(req)
    const body = await req.json()
    const { courseId, moduleId, lessonId, query, conversationId } = body

    if (!courseId || !query?.trim()) {
      return NextResponse.json({ error: 'courseId and query are required' }, { status: 400 })
    }

    const cId = parseInt(courseId.toString(), 10)
    let studentId: number | undefined
    let userId: number | undefined = session?.userId

    if (session?.role === 'student') {
      const student = await prisma.student.findFirst({
        where: { email: session.email || '' }
      })
      if (student) {
        studentId = student.id
        // Verify course enrollment access
        const enrollment = await prisma.courseEnrollment.findUnique({
          where: {
            courseId_studentId: {
              courseId: cId,
              studentId: student.id
            }
          }
        })
        if (!enrollment) {
          // If not enrolled yet, check if course is published
          const course = await prisma.course.findUnique({ where: { id: cId } })
          if (!course) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 403 })
          }
        }
      }
    }

    // 1. Find or create AI Conversation
    let activeConversation: any = null
    if (conversationId) {
      activeConversation = await prisma.aiConversation.findUnique({
        where: { id: parseInt(conversationId.toString(), 10) },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 6
          }
        }
      })
    }

    if (!activeConversation) {
      activeConversation = await prisma.aiConversation.create({
        data: {
          courseId: cId,
          studentId: studentId || null,
          userId: userId || null,
          moduleId: moduleId ? parseInt(moduleId.toString(), 10) : null,
          lessonId: lessonId ? parseInt(lessonId.toString(), 10) : null,
          title: query.trim().slice(0, 50) + (query.length > 50 ? '...' : '')
        },
        include: {
          messages: true
        }
      })
    }

    // Format previous messages
    const history = (activeConversation.messages || []).map((m: any) => ({
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

    // 3. Save User message and Assistant response
    await prisma.aiMessage.create({
      data: {
        conversationId: activeConversation.id,
        sender: 'user',
        content: query.trim(),
        tokensUsed: Math.ceil(query.length / 4)
      }
    })

    const assistantMsg = await prisma.aiMessage.create({
      data: {
        conversationId: activeConversation.id,
        sender: 'assistant',
        content: aiResult.answer,
        sources: JSON.stringify(aiResult.sources),
        tokensUsed: aiResult.tokensUsed
      }
    })

    // Update conversation timestamp
    await prisma.aiConversation.update({
      where: { id: activeConversation.id },
      data: { updatedAt: new Date() }
    })

    // Record AI usage metric
    if (userId) {
      try {
        await prisma.aiUsage.create({
          data: {
            userId,
            studentId: studentId || null,
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
      conversationId: activeConversation.id,
      messageId: assistantMsg.id,
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
