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

    const students = await prisma.student.findMany({
      where: { institutionId: user.institutionId },
      select: {
        id: true,
        name: true,
        email: true,
        college: true,
        degree: true,
        graduationYear: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, students })
  } catch (error: any) {
    console.error('Fetch institution students error:', error)
    return NextResponse.json({ error: 'Failed to fetch students list' }, { status: 500 })
  }
}
