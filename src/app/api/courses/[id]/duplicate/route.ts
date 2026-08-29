import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const resolvedParams = await params
    const courseId = parseInt(resolvedParams.id, 10)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    const body = await request.json()
    const { type, itemId } = body

    if (!type || !itemId) {
      return NextResponse.json({ error: 'Type and itemId are required' }, { status: 400 })
    }

    if (type === 'section') {
      const original = await prisma.courseModule.findUnique({
        where: { id: itemId },
        include: {
          resources: true,
          assignments: true,
          quizzes: { include: { questions: { include: { options: true } } } }
        }
      })

      if (!original) return NextResponse.json({ error: 'Section not found' }, { status: 404 })

      const highest = await prisma.courseModule.findFirst({
        where: { courseId },
        orderBy: { orderIndex: 'desc' }
      })
      const orderIndex = (highest?.orderIndex ?? -1) + 1

      const duplicated = await prisma.courseModule.create({
        data: {
          courseId,
          title: `${original.title} (Copy)`,
          description: original.description,
          orderIndex,
          resources: {
            create: original.resources.map(r => ({
              title: r.title,
              type: r.type,
              url: r.url,
              fileSize: r.fileSize,
              orderIndex: r.orderIndex
            }))
          },
          assignments: {
            create: original.assignments.map(a => ({
              courseId,
              title: `${a.title} (Copy)`,
              description: a.description,
              maxMarks: a.maxMarks,
              allowedFileTypes: a.allowedFileTypes,
              submissionType: a.submissionType,
              status: 'draft',
              orderIndex: a.orderIndex
            }))
          },
          quizzes: {
            create: original.quizzes.map(q => ({
              courseId,
              title: `${q.title} (Copy)`,
              description: q.description,
              timeLimit: q.timeLimit,
              maxAttempts: q.maxAttempts,
              passingScore: q.passingScore,
              status: 'draft',
              orderIndex: q.orderIndex,
              questions: {
                create: q.questions.map(qu => ({
                  question: qu.question,
                  type: qu.type,
                  marks: qu.marks,
                  explanation: qu.explanation,
                  orderIndex: qu.orderIndex,
                  options: {
                    create: qu.options.map(opt => ({
                      optionText: opt.optionText,
                      isCorrect: opt.isCorrect,
                      orderIndex: opt.orderIndex
                    }))
                  }
                }))
              }
            }))
          }
        }
      })

      return NextResponse.json({ success: true, duplicated })
    }

    if (type === 'resource') {
      const original = await prisma.courseResource.findUnique({ where: { id: itemId } })
      if (!original) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })

      const duplicated = await prisma.courseResource.create({
        data: {
          moduleId: original.moduleId,
          lessonId: original.lessonId,
          title: `${original.title} (Copy)`,
          type: original.type,
          url: original.url,
          fileSize: original.fileSize,
          orderIndex: original.orderIndex + 1
        }
      })
      return NextResponse.json({ success: true, duplicated })
    }

    if (type === 'assignment') {
      const original = await prisma.assignment.findUnique({ where: { id: itemId } })
      if (!original) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

      const duplicated = await prisma.assignment.create({
        data: {
          courseId,
          moduleId: original.moduleId,
          title: `${original.title} (Copy)`,
          description: original.description,
          maxMarks: original.maxMarks,
          allowedFileTypes: original.allowedFileTypes,
          submissionType: original.submissionType,
          status: 'draft',
          orderIndex: original.orderIndex + 1
        }
      })
      return NextResponse.json({ success: true, duplicated })
    }

    if (type === 'quiz') {
      const original = await prisma.quiz.findUnique({
        where: { id: itemId },
        include: { questions: { include: { options: true } } }
      })
      if (!original) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

      const duplicated = await prisma.quiz.create({
        data: {
          courseId,
          moduleId: original.moduleId,
          title: `${original.title} (Copy)`,
          description: original.description,
          timeLimit: original.timeLimit,
          maxAttempts: original.maxAttempts,
          passingScore: original.passingScore,
          status: 'draft',
          orderIndex: original.orderIndex + 1,
          questions: {
            create: original.questions.map(qu => ({
              question: qu.question,
              type: qu.type,
              marks: qu.marks,
              explanation: qu.explanation,
              orderIndex: qu.orderIndex,
              options: {
                create: qu.options.map(opt => ({
                  optionText: opt.optionText,
                  isCorrect: opt.isCorrect,
                  orderIndex: opt.orderIndex
                }))
              }
            }))
          }
        }
      })
      return NextResponse.json({ success: true, duplicated })
    }

    return NextResponse.json({ error: 'Invalid entity type for duplication' }, { status: 400 })
  } catch (err: any) {
    console.error('Error duplicating item:', err)
    return NextResponse.json({ error: 'Failed to duplicate item', details: err.message }, { status: 500 })
  }
}
