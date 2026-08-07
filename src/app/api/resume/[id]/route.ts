import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resume = await prisma.resume.findUnique({
      where: {
        id: parseInt(id, 10),
      }
    })

    if (!resume || resume.studentId !== session.userId) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...resume,
      analysis_data: JSON.parse(resume.analysisData || "{}")
    })
  } catch (error: any) {
    console.error('Fetch resume error:', error)
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 })
  }
}
