import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateAssignmentFeedback } from '@/lib/lmsAiService'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    const body = await req.json()
    const { assignmentId, submissionContent } = body

    if (!submissionContent || !submissionContent.trim()) {
      return NextResponse.json({ error: 'submissionContent is required' }, { status: 400 })
    }

    let title = 'Course Assignment'
    let instructions = ''

    if (assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: parseInt(assignmentId.toString(), 10) }
      })
      if (assignment) {
        title = assignment.title
        instructions = assignment.description || ''
      }
    }

    const feedback = await generateAssignmentFeedback({
      assignmentTitle: title,
      instructions,
      studentSubmission: submissionContent.trim()
    })

    return NextResponse.json({
      success: true,
      feedback
    })
  } catch (error: any) {
    console.error('[API AI Assignment Feedback Error]:', error)
    return NextResponse.json({ error: 'Failed to generate assignment feedback', details: error.message }, { status: 500 })
  }
}
