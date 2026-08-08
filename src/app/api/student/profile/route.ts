import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    let studentId = 1
    if (session && session.role === 'student' && session.userId) {
      studentId = session.userId
    }

    let rawStudents: any[] = await prisma.$queryRaw`
      SELECT 
        id, name, email, college, degree, 
        graduation_year as "graduationYear", phone, 
        cgpa, tenth_marks as "tenthMarks", twelfth_marks as "twelfthMarks", 
        github_url as "githubUrl", linkedin_url as "linkedinUrl", portfolio_url as "portfolioUrl", 
        created_at as "createdAt"
      FROM "students"
      WHERE id = ${studentId}
    `

    if (rawStudents.length === 0) {
      rawStudents = await prisma.$queryRaw`
        SELECT 
          id, name, email, college, degree, 
          graduation_year as "graduationYear", phone, 
          cgpa, tenth_marks as "tenthMarks", twelfth_marks as "twelfthMarks", 
          github_url as "githubUrl", linkedin_url as "linkedinUrl", portfolio_url as "portfolioUrl", 
          created_at as "createdAt"
        FROM "students"
        LIMIT 1
      `
    }

    if (rawStudents.length === 0) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const student = rawStudents[0]

    const mappedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      college: student.college,
      degree: student.degree,
      phone: student.phone,
      cgpa: student.cgpa ? Number(student.cgpa) : null,
      tenth_marks: student.tenthMarks ? Number(student.tenthMarks) : null,
      twelfth_marks: student.twelfthMarks ? Number(student.twelfthMarks) : null,
      graduation_year: student.graduationYear,
      github_url: student.githubUrl,
      linkedin_url: student.linkedinUrl,
      portfolio_url: student.portfolioUrl,
      created_at: student.createdAt
    }

    return NextResponse.json(mappedStudent, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    let studentId = 1
    if (session && session.role === 'student' && session.userId) {
      studentId = session.userId
    }

    const data = await request.json()

    // If password update requested
    if (data.currentPassword && data.newPassword) {
      const studentRows: any[] = await prisma.$queryRaw`SELECT password FROM "students" WHERE id = ${studentId}`
      if (studentRows.length > 0 && studentRows[0].password) {
        const validPassword = await bcrypt.compare(data.currentPassword, studentRows[0].password)
        if (validPassword) {
          const hashedPassword = await bcrypt.hash(data.newPassword, 10)
          await prisma.$executeRaw`UPDATE "students" SET password = ${hashedPassword} WHERE id = ${studentId}`
        }
      }
    }

    const cgpaVal = data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '' ? parseFloat(data.cgpa) : null
    const tenthVal = data.tenth_marks !== undefined && data.tenth_marks !== null && data.tenth_marks !== '' ? parseFloat(data.tenth_marks) : null
    const twelfthVal = data.twelfth_marks !== undefined && data.twelfth_marks !== null && data.twelfth_marks !== '' ? parseFloat(data.twelfth_marks) : null
    const nameVal = data.name || null
    const collegeVal = data.college || null
    const degreeVal = data.degree || null
    const phoneVal = data.phone || null
    const githubVal = data.github_url || null
    const linkedinVal = data.linkedin_url || null
    const portfolioVal = data.portfolio_url || null

    await prisma.$executeRaw`
      UPDATE "students"
      SET 
        cgpa = COALESCE(${cgpaVal}, cgpa),
        tenth_marks = COALESCE(${tenthVal}, tenth_marks),
        twelfth_marks = COALESCE(${twelfthVal}, twelfth_marks),
        name = COALESCE(${nameVal}, name),
        college = COALESCE(${collegeVal}, college),
        degree = COALESCE(${degreeVal}, degree),
        phone = COALESCE(${phoneVal}, phone),
        github_url = COALESCE(${githubVal}, github_url),
        linkedin_url = COALESCE(${linkedinVal}, linkedin_url),
        portfolio_url = COALESCE(${portfolioVal}, portfolio_url)
      WHERE id = ${studentId}
    `

    // Fetch updated record to return
    const updatedRows: any[] = await prisma.$queryRaw`
      SELECT id, name, email, cgpa, tenth_marks as "tenthMarks", twelfth_marks as "twelfthMarks"
      FROM "students"
      WHERE id = ${studentId}
    `

    const updatedStudent = updatedRows[0] || {}

    return NextResponse.json({ 
      success: true, 
      message: 'Academic profile updated successfully',
      student: {
        ...updatedStudent,
        cgpa: updatedStudent.cgpa ? Number(updatedStudent.cgpa) : cgpaVal,
        tenth_marks: updatedStudent.tenthMarks ? Number(updatedStudent.tenthMarks) : tenthVal,
        twelfth_marks: updatedStudent.twelfthMarks ? Number(updatedStudent.twelfthMarks) : twelfthVal
      }
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile', message: error?.message }, { status: 500 })
  }
}
