import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { generateStudentStudyPlan } from '@/lib/lmsAiService'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    const { searchParams } = new URL(req.url)
    const courseIdParam = searchParams.get('courseId')

    let studentId = 1 // Default to active student profile
    if (session?.role === 'student' && session.email) {
      const student = await prisma.student.findFirst({
        where: { email: session.email }
      })
      if (student) studentId = student.id
    }

    const courseId = courseIdParam ? parseInt(courseIdParam, 10) : undefined

    // Find active plan
    let activePlan = await prisma.studyPlan.findFirst({
      where: {
        studentId,
        status: 'active',
        ...(courseId ? { courseId } : {})
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        course: {
          select: { id: true, title: true }
        }
      }
    })

    if (!activePlan) {
      // Auto-generate initial plan
      const schedule = await generateStudentStudyPlan({
        studentId,
        courseId,
        dailyHours: 1.5
      })

      activePlan = await prisma.studyPlan.create({
        data: {
          studentId,
          courseId: courseId || null,
          title: courseId ? 'Course Mastery Schedule' : 'Comprehensive Weekly Study Plan',
          dailyHours: 1.5,
          weeklySchedule: JSON.stringify(schedule),
          status: 'active'
        },
        include: {
          course: {
            select: { id: true, title: true }
          }
        }
      })
    }

    let parsedSchedule = []
    try {
      parsedSchedule = JSON.parse(activePlan.weeklySchedule)
    } catch (e) {
      parsedSchedule = []
    }

    return NextResponse.json({
      success: true,
      plan: {
        ...activePlan,
        schedule: parsedSchedule
      }
    })
  } catch (error: any) {
    console.error('[API AI Study Planner GET Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch study plan', details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    const body = await req.json()
    const { courseId, targetExamDate, dailyHours = 1.5 } = body

    let studentId = 1
    if (session?.role === 'student' && session.email) {
      const student = await prisma.student.findFirst({
        where: { email: session.email }
      })
      if (student) studentId = student.id
    }

    const cId = courseId ? parseInt(courseId.toString(), 10) : null
    const hours = Math.min(Math.max(parseFloat(dailyHours.toString()) || 1.5, 0.5), 8)

    const schedule = await generateStudentStudyPlan({
      studentId,
      courseId: cId,
      targetExamDate,
      dailyHours: hours
    })

    // Archive previous active plans for this student/course
    await prisma.studyPlan.updateMany({
      where: {
        studentId,
        status: 'active',
        ...(cId ? { courseId: cId } : {})
      },
      data: { status: 'archived' }
    })

    const newPlan = await prisma.studyPlan.create({
      data: {
        studentId,
        courseId: cId,
        title: cId ? 'Personalized Course Study Plan' : 'Comprehensive Weekly Study Plan',
        targetExamDate: targetExamDate ? new Date(targetExamDate) : null,
        dailyHours: hours,
        weeklySchedule: JSON.stringify(schedule),
        status: 'active',
        generatedByAi: true
      },
      include: {
        course: {
          select: { id: true, title: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Personalized AI study plan generated successfully!',
      plan: {
        ...newPlan,
        schedule
      }
    })
  } catch (error: any) {
    console.error('[API AI Study Planner POST Error]:', error)
    return NextResponse.json({ error: 'Failed to generate study plan', details: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, dayIndex, taskId, completed } = body

    if (!planId || taskId === undefined) {
      return NextResponse.json({ error: 'planId and taskId are required' }, { status: 400 })
    }

    const plan = await prisma.studyPlan.findUnique({
      where: { id: parseInt(planId.toString(), 10) }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const schedule = JSON.parse(plan.weeklySchedule)
    for (const day of schedule) {
      for (const task of day.tasks) {
        if (task.id === taskId) {
          task.completed = Boolean(completed)
        }
      }
    }

    const updated = await prisma.studyPlan.update({
      where: { id: plan.id },
      data: {
        weeklySchedule: JSON.stringify(schedule)
      }
    })

    return NextResponse.json({
      success: true,
      schedule
    })
  } catch (error: any) {
    console.error('[API AI Study Planner PATCH Error]:', error)
    return NextResponse.json({ error: 'Failed to update study plan task', details: error.message }, { status: 500 })
  }
}
