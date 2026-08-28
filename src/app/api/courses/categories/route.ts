import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.courseCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { courses: true }
        }
      }
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error fetching course categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
