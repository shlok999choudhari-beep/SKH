import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createSupabaseSignedUrl, BUCKETS } from '@/lib/supabaseStorage'

export async function GET(
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
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                college: true
              }
            },
            grade: true
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Generate signed URLs for submissions with uploaded files
    const enrichedSubmissions = await Promise.all(
      assignment.submissions.map(async (sub: any) => {
        let signedDownloadUrl = null
        if (sub.fileUrl) {
          const signedRes = await createSupabaseSignedUrl(BUCKETS.ASSIGNMENTS, sub.fileUrl, 3600)
          signedDownloadUrl = signedRes.signedUrl || null
        }

        return {
          id: sub.id,
          studentId: sub.studentId,
          studentName: sub.student?.name || 'Student',
          studentEmail: sub.student?.email,
          studentCollege: sub.student?.college,
          fileName: sub.fileName,
          fileSize: sub.fileSize,
          fileUrl: sub.fileUrl,
          signedDownloadUrl,
          textAnswer: sub.textAnswer,
          status: sub.status,
          submittedAt: sub.submittedAt,
          grade: sub.grade
        }
      })
    )

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        maxMarks: assignment.maxMarks,
        dueDate: assignment.dueDate,
        course: assignment.course
      },
      submissions: enrichedSubmissions
    })
  } catch (err: any) {
    console.error('Error fetching submissions:', err)
    return NextResponse.json({ error: 'Failed to fetch submissions', details: err.message }, { status: 500 })
  }
}
