import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { issueCourseCertificate } from '@/lib/certificateService'

export async function POST(req: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        trainer: { select: { id: true, userId: true, user: { select: { name: true } } } },
        institution: { select: { id: true, name: true } },
        modules: true
      }
    })

    if (courses.length === 0) {
      return NextResponse.json({ error: 'No courses found. Please seed courses first.' }, { status: 400 })
    }

    const students = await prisma.student.findMany({ take: 5 })
    const users = await prisma.user.findMany({ take: 5 })
    const defaultAuthorId = users[0]?.id || 1

    let seededAnnouncements = 0
    let seededDiscussions = 0
    let seededReplies = 0
    let seededCertificates = 0

    for (const course of courses) {
      const firstModule = course.modules[0] || null

      // 1. Seed Course Announcements
      const announcementsData = [
        {
          title: `📢 Welcome to ${course.title}!`,
          content: `Welcome everyone to the **${course.title}** masterclass! Please review the syllabus, complete the initial module exercises, and don't hesitate to post in the Discussion Forum if you run into any architectural bottlenecks. Live Q&A is scheduled every Friday at 4 PM.`,
          isPinned: true,
          status: 'published'
        },
        {
          title: `⚡ Assessment Guidelines & Best Practices`,
          content: `Please make sure to review the rubric before submitting your practical assignment. Ensure your code compiles cleanly and adheres to the structural principles demonstrated in Module 1.`,
          isPinned: false,
          status: 'published'
        }
      ]

      for (const ann of announcementsData) {
        const existing = await prisma.courseAnnouncement.findFirst({
          where: { courseId: course.id, title: ann.title }
        })
        if (!existing) {
          await prisma.courseAnnouncement.create({
            data: {
              courseId: course.id,
              moduleId: firstModule?.id || null,
              authorId: course.trainer?.userId || defaultAuthorId,
              trainerId: course.trainerId,
              title: ann.title,
              content: ann.content,
              isPinned: ann.isPinned,
              status: ann.status
            }
          })
          seededAnnouncements++
        }
      }

      // 2. Seed Discussions & Replies
      const discussionsData = [
        {
          title: `How should we handle state hydration with Server Components in ${course.title}?`,
          content: `When streaming large datasets, is it better to pass initial props down from the Server Component or use a suspense boundary with client fetch hooks?`,
          isPinned: true,
          replies: [
            {
              content: `Passing data as props directly from the Server Component ensures zero roundtrips and SEO indexing. Use Suspense for non-blocking sub-trees!`,
              isHelpful: true,
              isTrainerReply: true
            },
            {
              content: `That cleared it up, thank you! I verified with React Actions and the latency dropped significantly.`,
              isHelpful: false,
              isTrainerReply: false
            }
          ]
        },
        {
          title: `Clarification regarding the Module 1 practical submission format`,
          content: `Does the ZIP submission include node_modules or just the src/ folder?`,
          isPinned: false,
          replies: [
            {
              content: `Please exclude node_modules and cache directories before zipping. We run build verification in an isolated sandbox.`,
              isHelpful: true,
              isTrainerReply: true
            }
          ]
        }
      ]

      for (const disc of discussionsData) {
        const existing = await prisma.courseDiscussion.findFirst({
          where: { courseId: course.id, title: disc.title }
        })
        if (!existing) {
          const student = students[0]
          const createdDisc = await prisma.courseDiscussion.create({
            data: {
              courseId: course.id,
              moduleId: firstModule?.id || null,
              authorId: defaultAuthorId,
              studentId: student ? student.id : null,
              title: disc.title,
              content: disc.content,
              isPinned: disc.isPinned,
              helpfulCount: disc.isPinned ? 5 : 2
            }
          })
          seededDiscussions++

          for (const rep of disc.replies) {
            await prisma.discussionReply.create({
              data: {
                discussionId: createdDisc.id,
                authorId: rep.isTrainerReply ? (course.trainer?.userId || defaultAuthorId) : defaultAuthorId,
                studentId: rep.isTrainerReply ? null : (students[1]?.id || student?.id || null),
                content: rep.content,
                isHelpful: rep.isHelpful
              }
            })
            seededReplies++
          }
        }
      }

      // 3. Seed Sample Certificate for Student on Course 1
      if (course.id === courses[0].id && students[0]) {
        const student = students[0]
        let enrollment = await prisma.courseEnrollment.findUnique({
          where: {
            courseId_studentId: {
              courseId: course.id,
              studentId: student.id
            }
          },
          include: { certificate: true }
        })

        if (!enrollment) {
          enrollment = await prisma.courseEnrollment.create({
            data: {
              courseId: course.id,
              studentId: student.id,
              status: 'active',
              progressPercent: 100
            },
            include: { certificate: true }
          })
        }

        if (!enrollment.certificate) {
          const originUrl = req.nextUrl.origin
          const certResult = await issueCourseCertificate({
            enrollmentId: enrollment.id,
            courseId: course.id,
            studentId: student.id,
            studentName: student.name,
            courseTitle: course.title,
            instructorName: course.trainer?.user?.name || 'PlaceIQ Certified Instructor',
            institutionName: course.institution?.name || 'PlaceIQ Academic Division',
            lessonsCompleted: 8,
            assignmentsCompleted: 2,
            quizzesPassed: 1,
            finalScore: 94.5,
            originUrl
          })
          seededCertificates++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Phase 3 Collaboration & Certification seeded successfully!',
      stats: {
        seededAnnouncements,
        seededDiscussions,
        seededReplies,
        seededCertificates
      }
    })
  } catch (err: any) {
    console.error('Error seeding Phase 3:', err)
    return NextResponse.json({ error: 'Failed to seed Phase 3', details: err.message }, { status: 500 })
  }
}
