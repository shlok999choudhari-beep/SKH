import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    const assignmentId = parseInt(resolvedParams.id, 10)

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          select: { id: true, title: true, slug: true, category: { select: { name: true } }, trainer: { select: { user: { select: { name: true } } } } }
        },
        module: {
          select: { id: true, title: true }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    let studentSubmission = null
    if (session?.role === 'student' && session?.userId) {
      studentSubmission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: session.userId
          }
        },
        include: {
          grade: true
        }
      })
    }

    return NextResponse.json({
      assignment: {
        ...assignment,
        studentSubmission
      }
    })
  } catch (err: any) {
    console.error('Error fetching assignment details:', err)
    return NextResponse.json({ error: 'Failed to fetch assignment details', details: err.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignmentId = parseInt(resolvedParams.id, 10)
    const body = await req.json()

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.moduleId !== undefined) data.moduleId = body.moduleId ? parseInt(body.moduleId, 10) : null
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.maxMarks !== undefined) data.maxMarks = parseFloat(body.maxMarks)
    if (body.allowedFileTypes !== undefined) data.allowedFileTypes = body.allowedFileTypes
    if (body.maxFileSizeMb !== undefined) data.maxFileSizeMb = parseInt(body.maxFileSizeMb, 10)
    if (body.submissionType !== undefined) data.submissionType = body.submissionType
    if (body.status !== undefined) data.status = body.status
    if (body.orderIndex !== undefined) data.orderIndex = parseInt(body.orderIndex, 10)

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data
    })

    return NextResponse.json({ success: true, assignment: updated })
  } catch (err: any) {
    console.error('Error updating assignment:', err)
    return NextResponse.json({ error: 'Failed to update assignment', details: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignmentId = parseInt(resolvedParams.id, 10)
    await prisma.assignment.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting assignment:', err)
    return NextResponse.json({ error: 'Failed to delete assignment', details: err.message }, { status: 500 })
  }
}
