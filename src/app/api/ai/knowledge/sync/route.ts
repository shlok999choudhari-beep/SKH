import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { indexCourseMaterials } from '@/lib/lmsAiService'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      // If no specific course provided, index all courses
      const allCourses = await prisma.course.findMany({ select: { id: true } })
      let totalChunks = 0
      for (const c of allCourses) {
        const count = await indexCourseMaterials(c.id)
        totalChunks += count
      }
      return NextResponse.json({
        success: true,
        message: `Indexed ${totalChunks} knowledge chunks across ${allCourses.length} courses.`
      })
    }

    const cId = parseInt(courseId.toString(), 10)
    const chunkCount = await indexCourseMaterials(cId)

    return NextResponse.json({
      success: true,
      courseId: cId,
      chunkCount,
      message: `Successfully indexed ${chunkCount} knowledge chunks for course ${cId}.`
    })
  } catch (error: any) {
    console.error('[API AI Knowledge Sync Error]:', error)
    return NextResponse.json({ error: 'Failed to sync knowledge chunks', details: error.message }, { status: 500 })
  }
}
