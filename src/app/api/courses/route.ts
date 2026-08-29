import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'
import { validateLearningScope } from '@/lib/learningScopeGuard'

function generateCourseCode(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean)
  let prefix = ''
  if (words.length >= 2) {
    prefix = words.map(w => w[0].toUpperCase()).slice(0, 3).join('')
  } else if (words.length === 1) {
    prefix = words[0].slice(0, 3).toUpperCase()
  }
  if (!prefix || prefix.length < 2) prefix = 'CRS'

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}-${randomPart}`
}

const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortName: z.string().optional(),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  department: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.number().nullable().optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).default('Beginner'),
  estimatedDuration: z.string().optional(),
  thumbnail: z.string().optional(),
  learningObjectives: z.string().optional(),
  prerequisites: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  trainerId: z.number().optional()
})

// GET /api/courses - List courses with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const difficulty = searchParams.get('difficulty') || ''
    const status = searchParams.get('status') || ''
    const trainerIdParam = searchParams.get('trainerId')
    const sort = searchParams.get('sort') || 'newest'
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const session = await getSession()

    // Build Prisma where filter
    const where: any = {}

    // Non-admin / non-trainer users should only see published courses by default unless asking for their own
    if (!session || (session.role !== 'institution-admin' && session.role !== 'trainer')) {
      where.status = 'published'
    } else if (status && status !== 'all') {
      where.status = status
    }

    if (search.trim()) {
      const scopeCheck = await validateLearningScope(search.trim())
      if (!scopeCheck.allowed) {
        return NextResponse.json({
          courses: [],
          blocked: true,
          error: scopeCheck.blockedMessage,
          message: scopeCheck.blockedMessage
        })
      }

      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { department: { contains: search.trim(), mode: 'insensitive' } },
        { shortName: { contains: search.trim(), mode: 'insensitive' } },
        { joinCode: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    if (category && category !== 'all') {
      where.category = {
        slug: category
      }
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty
    }

    if (trainerIdParam) {
      const parsedTrainerId = parseInt(trainerIdParam, 10)
      if (!isNaN(parsedTrainerId)) {
        where.trainerId = parsedTrainerId
      }
    }

    // Determine orderBy
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' }
    } else if (sort === 'title') {
      orderBy = { title: 'asc' }
    }

    let courses = await prisma.course.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        category: true,
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            modules: true,
            enrollments: true
          }
        },
        modules: {
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                lessons: true,
                resources: true
              }
            }
          }
        },
        enrollments: session?.role === 'student' ? {
          where: { studentId: session.userId },
          select: {
            id: true,
            status: true,
            progressPercent: true,
            enrolledAt: true,
            lastAccessedAt: true
          }
        } : false
      }
    })

    // If courses table is empty or missing CGL, auto-seed
    if (courses.length === 0 || !courses.some((c: any) => c.slug === 'computer-graphics-lab')) {
      try {
        const seedUrl = new URL('/api/courses/seed', request.url)
        await fetch(seedUrl.toString(), { method: 'POST' })
        // Refetch after seeding
        courses = await prisma.course.findMany({
          where,
          orderBy,
          take: limit,
          include: {
            category: true,
            trainer: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            },
            _count: {
              select: { modules: true, enrollments: true }
            },
            modules: {
              select: {
                id: true,
                title: true,
                _count: { select: { lessons: true, resources: true } }
              }
            },
            enrollments: session?.role === 'student' ? {
              where: { studentId: session.userId },
              select: {
                id: true,
                status: true,
                progressPercent: true,
                enrolledAt: true,
                lastAccessedAt: true
              }
            } : false
          }
        })
      } catch (seedErr) {
        console.warn('Auto-seed check warning:', seedErr)
      }
    }

    // Map courses to friendly response format
    const mappedCourses = courses.map((course: any) => {
      const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m._count?.lessons || 0), 0) || 0
      const totalResources = course.modules?.reduce((acc: number, m: any) => acc + (m._count?.resources || 0), 0) || 0
      const isEnrolled = course.enrollments && course.enrollments.length > 0
      const studentEnrollment = isEnrolled ? course.enrollments[0] : null

      return {
        id: course.id,
        title: course.title,
        shortName: course.shortName || '',
        academicYear: course.academicYear || 'AY 2026-27',
        semester: course.semester || 'Semester I',
        department: course.department || 'Computer Engineering',
        joinCode: course.joinCode,
        slug: course.slug,
        description: course.description,
        thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
        category: course.category?.name || 'General',
        categorySlug: course.category?.slug || 'general',
        difficulty: course.difficulty,
        estimatedDuration: course.estimatedDuration || '4 Weeks',
        learningObjectives: course.learningObjectives,
        prerequisites: course.prerequisites,
        status: course.status,
        trainer: {
          id: course.trainer?.id,
          name: course.trainer?.user?.name || 'PlaceIQ Instructor',
          email: course.trainer?.user?.email,
          rating: course.trainer?.rating || 4.9,
          bio: course.trainer?.bio
        },
        moduleCount: course._count?.modules || 0,
        lessonCount: totalLessons,
        resourceCount: totalResources,
        enrolledStudentsCount: course._count?.enrollments || 0,
        isEnrolled,
        enrollment: studentEnrollment,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }
    })

    return NextResponse.json({ courses: mappedCourses })
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST /api/courses - Create course (Trainer or Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'trainer' && session.role !== 'institution-admin')) {
      return NextResponse.json({ error: 'Unauthorized. Trainer or Admin role required.' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createCourseSchema.parse(body)

    let assignedTrainerId = validated.trainerId

    // If session is a trainer, look up their Trainer profile
    if (session.role === 'trainer') {
      const trainerRecord = await prisma.trainer.findFirst({
        where: { userId: session.userId }
      })
      if (trainerRecord) {
        assignedTrainerId = trainerRecord.id
      }
    }

    // Generate unique slug and course code
    const baseSlug = validated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`
    const generatedCode = generateCourseCode(validated.title)

    const newCourse = await prisma.course.create({
      data: {
        title: validated.title,
        shortName: validated.shortName || (validated.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)),
        academicYear: validated.academicYear || 'AY 2026-27',
        semester: validated.semester || 'Semester I',
        department: validated.department || 'Computer Engineering',
        joinCode: generatedCode,
        joinCodeEnabled: true,
        slug: uniqueSlug,
        description: validated.description || '',
        categoryId: validated.categoryId || null,
        difficulty: validated.difficulty,
        estimatedDuration: validated.estimatedDuration || '4 Weeks',
        thumbnail: validated.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        learningObjectives: validated.learningObjectives || '',
        prerequisites: validated.prerequisites || '',
        status: validated.status,
        trainerId: assignedTrainerId || null
      },
      include: {
        category: true,
        trainer: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, course: newCourse }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course', details: error.message }, { status: 500 })
  }
}
