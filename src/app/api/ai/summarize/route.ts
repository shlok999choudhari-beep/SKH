import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { summarizeLesson } from '@/lib/lmsAiService'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    const body = await req.json()
    const { lessonId, customContent, lessonTitle } = body

    let title = lessonTitle || 'Curriculum Lesson'
    let content = customContent || ''

    if (lessonId) {
      const lesson = await prisma.courseLesson.findUnique({
        where: { id: parseInt(lessonId.toString(), 10) }
      })
      if (lesson) {
        title = lesson.title
        content = [lesson.description, lesson.content].filter(Boolean).join('\n\n')
      }
    }

    if (!content.trim()) {
      content = 'This lesson covers fundamental architectural concepts, state management, and practical production implementation.'
    }

    const summaryResult = await summarizeLesson({
      lessonTitle: title,
      content: content.trim()
    })

    return NextResponse.json({
      success: true,
      lessonTitle: title,
      summary: summaryResult
    })
  } catch (error: any) {
    console.error('[API AI Summarize Error]:', error)
    return NextResponse.json({ error: 'Failed to summarize lesson', details: error.message }, { status: 500 })
  }
}
