import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { institutionId: true }
    })

    if (!user || !user.institutionId) {
      return NextResponse.json({ error: 'Institution profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const studentIdParam = searchParams.get('studentId') || ''

    const where: any = {
      institutionId: user.institutionId,
      accessLevel: { in: ['INSTITUTION_ONLY', 'SHARED'] } // Must NOT include PRIVATE documents
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (status && status !== 'ALL') {
      where.verificationStatus = status
    }

    if (studentIdParam) {
      const sId = parseInt(studentIdParam, 10)
      if (!isNaN(sId)) {
        where.studentId = sId
      }
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { documentType: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, college: true }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json({ success: true, documents })
  } catch (error: any) {
    console.error('Fetch institution shared documents error:', error)
    return NextResponse.json({ error: 'Failed to fetch shared documents' }, { status: 500 })
  }
}
