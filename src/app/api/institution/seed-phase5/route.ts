import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  extractAndVerifyStudentSkills,
  calculatePlacementReadiness,
  detectStudentsNeedingAttention
} from '@/lib/placementIntelligenceService'

export async function POST(req: NextRequest) {
  try {
    const [students, courses] = await Promise.all([
      prisma.student.findMany({ take: 20 }),
      prisma.course.findMany({
        include: {
          modules: {
            include: { lessons: true, quizzes: true, assignments: true }
          }
        }
      })
    ])

    // Seed enrollments & quiz attempts for students
    for (let i = 0; i < Math.min(students.length, 10); i++) {
      const s = students[i]
      const c = courses[i % courses.length]
      if (c) {
        // Upsert enrollment
        const progressPercent = i === 0 ? 100 : i % 2 === 0 ? 80 : 35
        const enr = await prisma.courseEnrollment.upsert({
          where: {
            courseId_studentId: {
              courseId: c.id,
              studentId: s.id
            }
          },
          update: {
            progressPercent,
            status: progressPercent === 100 ? 'completed' : 'active'
          },
          create: {
            courseId: c.id,
            studentId: s.id,
            progressPercent,
            status: progressPercent === 100 ? 'completed' : 'active'
          }
        })

        // Seed lesson progress
        const firstModule = c.modules[0]
        if (firstModule && firstModule.lessons.length > 0) {
          for (const l of firstModule.lessons) {
            const existingProgress = await prisma.learningProgress.findFirst({
              where: {
                enrollmentId: enr.id,
                lessonId: l.id
              }
            })
            if (existingProgress) {
              await prisma.learningProgress.update({
                where: { id: existingProgress.id },
                data: { isCompleted: true }
              })
            } else {
              await prisma.learningProgress.create({
                data: {
                  enrollmentId: enr.id,
                  studentId: s.id,
                  lessonId: l.id,
                  isCompleted: true
                }
              })
            }
          }
        }

        // Seed quiz attempt if quiz exists
        if (firstModule && firstModule.quizzes.length > 0) {
          const q = firstModule.quizzes[0]
          const score = i === 0 ? 100 : 75 + ((i * 7) % 25)
          const passed = score >= q.passingScore
          await prisma.quizAttempt.create({
            data: {
              quizId: q.id,
              studentId: s.id,
              totalMarks: 100,
              obtainedMarks: score,
              percentage: score,
              passed,
              status: 'completed',
              timeTakenSeconds: 420
            }
          })
        }
      }
    }

    let totalSkillsExtracted = 0
    let totalReadinessProfiles = 0

    for (const student of students) {
      // 1. Extract & Verify Skills
      const skills = await extractAndVerifyStudentSkills(student.id)
      totalSkillsExtracted += skills.length

      // 2. Calculate Placement Readiness
      await calculatePlacementReadiness(student.id)
      totalReadinessProfiles++
    }

    // 3. Run At-Risk Detection
    const atRiskList = await detectStudentsNeedingAttention(1)

    return NextResponse.json({
      success: true,
      message: 'Phase 5 Institutional Analytics & Placement Intelligence seeded successfully!',
      stats: {
        studentsProcessed: students.length,
        totalSkillsExtracted,
        readinessProfilesCreated: totalReadinessProfiles,
        atRiskDetected: atRiskList.length
      }
    })
  } catch (error: any) {
    console.error('[Seed Phase 5 Error]:', error)
    return NextResponse.json({ error: 'Failed to seed Phase 5 data', details: error.message }, { status: 500 })
  }
}
