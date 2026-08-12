import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
            domain: true,
            contactEmail: true
          }
        }
      }
    })

    if (!user || !user.institution || !user.institutionId) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, institution: user.institution })
  } catch (error: any) {
    console.error('Error fetching current institution profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
