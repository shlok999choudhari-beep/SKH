import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const internshipSchema = z.object({
  institution_id: z.coerce.number().optional().nullable().default(1),
  company_id: z.coerce.number().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().optional().nullable(),
  stipend: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  min_cgpa: z.coerce.number().optional().nullable(),
  min_tenth_marks: z.coerce.number().optional().nullable(),
  min_twelfth_marks: z.coerce.number().optional().nullable(),
  deadline: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    const companyId = searchParams.get('companyId')
    const queryStudentId = searchParams.get('studentId')

    let activeStudentId: number | null = queryStudentId ? parseInt(queryStudentId, 10) : null
    if (!activeStudentId && session && session.role === 'student' && session.userId) {
      activeStudentId = session.userId
    }
    if (!activeStudentId) {
      activeStudentId = 1
    }

    const parsedInstId = institutionId ? parseInt(institutionId, 10) : null
    const parsedCompId = companyId ? parseInt(companyId, 10) : null

    // Parallelize all raw SQL queries for students, internships, and applications
    const [allStudentsRaw, rawInternshipsRaw, rawAppsRaw] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT id, name, email, degree, graduation_year as "graduationYear", cgpa, tenth_marks as "tenthMarks", twelfth_marks as "twelfthMarks", institution_id as "institutionId"
        FROM "students"
      `,
      prisma.$queryRaw<any[]>`
        SELECT i.*, c.company_name, c.industry
        FROM "internships" i
        LEFT JOIN "companies" c ON i.company_id = c.id
        ORDER BY i.created_at DESC
      `,
      prisma.$queryRaw<any[]>`
        SELECT a.*, s.name as student_name, s.email as student_email
        FROM "internship_applications" a
        LEFT JOIN "students" s ON a.student_id = s.id
      `
    ])

    let allStudents = allStudentsRaw || []
    if (parsedInstId) {
      allStudents = allStudents.filter(s => Number(s.institutionId) === parsedInstId)
    }

    let rawInternships = rawInternshipsRaw || []
    if (parsedInstId) {
      rawInternships = rawInternships.filter(i => Number(i.institution_id) === parsedInstId)
    }
    if (parsedCompId) {
      rawInternships = rawInternships.filter(i => Number(i.company_id) === parsedCompId)
    }

    const rawApps = rawAppsRaw || []

    const mappedInternships = rawInternships.map(i => {
      const apps = rawApps.filter(a => Number(a.internship_id) === Number(i.id))
      const studentApp = rawApps.find(a => Number(a.internship_id) === Number(i.id) && Number(a.student_id) === Number(activeStudentId))

      const offeredCount = apps.filter(a => a.status === 'offered' || a.status === 'pending' || a.status === 'applied').length
      const codingCount = apps.filter(a => a.status === 'coding_round').length
      const interviewCount = apps.filter(a => a.status === 'interview').length
      const placedCount = apps.filter(a => a.status === 'placed' || a.status === 'accepted').length

      const reqCgpa = i.min_cgpa ? Number(i.min_cgpa) : 0
      const reqTenth = i.min_tenth_marks ? Number(i.min_tenth_marks) : 0
      const reqTwelfth = i.min_twelfth_marks ? Number(i.min_twelfth_marks) : 0

      const eligibleStudentsList = allStudents.filter((s: any) => {
        const studentCgpa = s.cgpa ? Number(s.cgpa) : 0
        const studentTenth = s.tenthMarks ? Number(s.tenthMarks) : 0
        const studentTwelfth = s.twelfthMarks ? Number(s.twelfthMarks) : 0

        const meetsCgpa = reqCgpa > 0 ? studentCgpa >= reqCgpa : true
        const meetsTenth = reqTenth > 0 ? studentTenth >= reqTenth : true
        const meetsTwelfth = reqTwelfth > 0 ? studentTwelfth >= reqTwelfth : true

        return meetsCgpa && meetsTenth && meetsTwelfth
      })

      return {
        id: i.id,
        institution_id: i.institution_id,
        company_id: i.company_id,
        title: i.title,
        description: i.description,
        location: i.location,
        stipend: i.stipend,
        duration: i.duration,
        min_cgpa: i.min_cgpa ? Number(i.min_cgpa) : null,
        min_tenth_marks: i.min_tenth_marks ? Number(i.min_tenth_marks) : null,
        min_twelfth_marks: i.min_twelfth_marks ? Number(i.min_twelfth_marks) : null,
        status: i.status || 'open',
        user_application_status: studentApp ? studentApp.status : null,
        createdAt: i.created_at,
        company_name: i.company_name || 'Partner Company',
        eligible_students_count: eligibleStudentsList.length,
        pipeline: {
          offered: offeredCount,
          coding_round: codingCount,
          interview: interviewCount,
          placed: placedCount,
          total_applications: apps.length
        }
      }
    })

    return NextResponse.json(
      { internships: mappedInternships, total_students: allStudents.length },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error: any) {
    console.error('Error fetching internships:', error)
    return NextResponse.json({ error: 'Internal Server Error', message: error?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    const body = await request.json()
    const validatedData = internshipSchema.parse(body)

    let compId: number | null = validatedData.company_id || null
    if (session && session.role === 'company' && session.userId) {
      compId = session.userId
    }

    if (compId) {
      const compRows: any[] = await prisma.$queryRaw`SELECT id FROM "companies" WHERE id = ${compId}`
      if (compRows.length === 0) {
        const firstComp: any[] = await prisma.$queryRaw`SELECT id FROM "companies" LIMIT 1`
        compId = firstComp[0]?.id || null
      }
    } else {
      const firstComp: any[] = await prisma.$queryRaw`SELECT id FROM "companies" LIMIT 1`
      compId = firstComp[0]?.id || null
    }

    let instId = validatedData.institution_id || 1
    const instRows: any[] = await prisma.$queryRaw`SELECT id FROM "institutions" WHERE id = ${instId}`
    if (instRows.length === 0) {
      const firstInst: any[] = await prisma.$queryRaw`SELECT id FROM "institutions" LIMIT 1`
      if (firstInst.length > 0) {
        instId = firstInst[0].id
      }
    }

    const minCgpaVal = validatedData.min_cgpa !== undefined && validatedData.min_cgpa !== null ? validatedData.min_cgpa : null
    const minTenthVal = validatedData.min_tenth_marks !== undefined && validatedData.min_tenth_marks !== null ? validatedData.min_tenth_marks : null
    const minTwelfthVal = validatedData.min_twelfth_marks !== undefined && validatedData.min_twelfth_marks !== null ? validatedData.min_twelfth_marks : null
    const deadlineVal = validatedData.deadline ? new Date(validatedData.deadline) : null

    const insertRes: any[] = await prisma.$queryRaw`
      INSERT INTO "internships" (
        "institution_id", "company_id", "title", "description", 
        "location", "stipend", "duration", "min_cgpa", 
        "min_tenth_marks", "min_twelfth_marks", "deadline", "status"
      ) VALUES (
        ${instId}, ${compId}, ${validatedData.title}, ${validatedData.description},
        ${validatedData.location || 'Remote'}, ${validatedData.stipend || '₹25,000 / month'}, ${validatedData.duration || '3 Months'}, ${minCgpaVal},
        ${minTenthVal}, ${minTwelfthVal}, ${deadlineVal}, ${validatedData.status || 'open'}
      )
      RETURNING "id"
    `

    const newId = insertRes[0]?.id

    return NextResponse.json({ 
      success: true, 
      internshipId: newId 
    }, { status: 201 })

  } catch (error: any) {
    if (error instanceof z.ZodError || error?.name === 'ZodError') {
      const issues = error.issues || error.errors || []
      const messages = issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).join(', ')
      return NextResponse.json({ error: `Validation Error: ${messages}`, details: issues }, { status: 400 })
    }
    console.error('Error creating internship:', error)
    return NextResponse.json({ error: 'Internal Server Error', message: error?.message || 'Unknown error' }, { status: 500 })
  }
}
