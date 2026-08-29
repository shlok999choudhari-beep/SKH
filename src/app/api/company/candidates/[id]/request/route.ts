import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { recordCandidateInterest } from '@/lib/candidateIntelligenceService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const studentId = parseInt(resolvedParams.id)
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid candidate ID' }, { status: 400 })
    }

    const session = await getSession()
    const companyId = session?.role === 'company' ? session.userId : 1

    let companyName = 'Partner Technology Recruiter'
    if (companyId) {
      const comp = await prisma.company.findUnique({
        where: { id: companyId },
        select: { companyName: true }
      })
      if (comp?.companyName) {
        companyName = comp.companyName
      }
    }

    const body = await request.json().catch(() => ({}))
    const jobTitle = body.jobTitle || 'Software Developer'
    const notes = body.notes || ''

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, email: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const result = await recordCandidateInterest({
      companyId,
      companyName,
      studentId,
      studentName: student.name,
      jobTitle,
      notes
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      candidateId: studentId,
      status: 'Requested'
    })
  } catch (error: any) {
    console.error('Candidate request error:', error)
    return NextResponse.json({ error: 'Failed to submit candidate request', details: error.message }, { status: 500 })
  }
}
