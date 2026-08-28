import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { indexCourseMaterials, generateStudentStudyPlan, calculateStudentInsights } from '@/lib/lmsAiService'

export async function POST(req: NextRequest) {
  try {
    const courses = await prisma.course.findMany({ select: { id: true, title: true } })
    let indexedCount = 0

    // 1. Ingest & Index Knowledge Chunks for every course
    for (const c of courses) {
      const count = await indexCourseMaterials(c.id)
      indexedCount += count
    }

    // 2. Seed Study Plan for Student 1
    const student = await prisma.student.findFirst()
    if (student) {
      const schedule = await generateStudentStudyPlan({
        studentId: student.id,
        courseId: courses[0]?.id || null,
        dailyHours: 1.5
      })

      await prisma.studyPlan.deleteMany({
        where: { studentId: student.id }
      })

      await prisma.studyPlan.create({
        data: {
          studentId: student.id,
          courseId: courses[0]?.id || null,
          title: 'Full-Stack Engineering & AI Mastery Plan',
          dailyHours: 1.5,
          weeklySchedule: JSON.stringify(schedule),
          status: 'active',
          generatedByAi: true
        }
      })

      // 3. Seed Learning Insights
      const insights = await calculateStudentInsights(student.id, courses[0]?.id || null)
      await prisma.learningInsight.deleteMany({
        where: { studentId: student.id }
      })
      await prisma.learningInsight.create({
        data: {
          studentId: student.id,
          courseId: courses[0]?.id || null,
          strongTopics: JSON.stringify(insights.strongTopics),
          weakTopics: JSON.stringify(insights.weakTopics),
          recommendedActions: JSON.stringify(insights.recommendations)
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Phase 4 AI Knowledge Base and Study Plans seeded successfully!',
      stats: {
        indexedCourses: courses.length,
        totalKnowledgeChunks: indexedCount
      }
    })
  } catch (error: any) {
    console.error('[Seed Phase 4 Error]:', error)
    return NextResponse.json({ error: 'Failed to seed Phase 4', details: error.message }, { status: 500 })
  }
}
