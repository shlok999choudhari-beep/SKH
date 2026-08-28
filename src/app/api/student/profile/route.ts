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

    let student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      student = await prisma.student.findFirst()
    }

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const mappedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      college: student.college,
      degree: student.degree,
      phone: student.phone,
      cgpa: student.cgpa ? Number(student.cgpa) : null,
      tenth_marks: student.tenthMarks ? Number(student.tenthMarks) : null,
      tenthMarks: student.tenthMarks ? Number(student.tenthMarks) : null,
      twelfth_marks: student.twelfthMarks ? Number(student.twelfthMarks) : null,
      twelfthMarks: student.twelfthMarks ? Number(student.twelfthMarks) : null,
      graduation_year: student.graduationYear,
      graduationYear: student.graduationYear,
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
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { password: true }
      })
      if (student?.password) {
        let validPassword = false
        if (student.password.startsWith('$2a$') || student.password.startsWith('$2b$') || student.password.startsWith('$2y$')) {
          try {
            validPassword = await bcrypt.compare(data.currentPassword, student.password)
          } catch {
            validPassword = false
          }
        }
        if (!validPassword && student.password === data.currentPassword) {
          validPassword = true
        }

        if (validPassword) {
          const hashedPassword = await bcrypt.hash(data.newPassword, 12)
          await prisma.student.update({
            where: { id: studentId },
            data: { password: hashedPassword }
          })
        }
      }
    }

    const updatePayload: Record<string, any> = {}

    if (data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '') {
      updatePayload.cgpa = parseFloat(data.cgpa)
    }
    if (data.tenth_marks !== undefined && data.tenth_marks !== null && data.tenth_marks !== '') {
      updatePayload.tenth_marks = parseFloat(data.tenth_marks)
    } else if (data.tenthMarks !== undefined && data.tenthMarks !== null && data.tenthMarks !== '') {
      updatePayload.tenth_marks = parseFloat(data.tenthMarks)
    }
    if (data.twelfth_marks !== undefined && data.twelfth_marks !== null && data.twelfth_marks !== '') {
      updatePayload.twelfth_marks = parseFloat(data.twelfth_marks)
    } else if (data.twelfthMarks !== undefined && data.twelfthMarks !== null && data.twelfthMarks !== '') {
      updatePayload.twelfth_marks = parseFloat(data.twelfthMarks)
    }
    if (data.name) updatePayload.name = data.name
    if (data.college) updatePayload.college = data.college
    if (data.degree) updatePayload.degree = data.degree
    if (data.phone) updatePayload.phone = data.phone
    if (data.github_url !== undefined) updatePayload.github_url = data.github_url
    if (data.linkedin_url !== undefined) updatePayload.linkedin_url = data.linkedin_url
    if (data.portfolio_url !== undefined) updatePayload.portfolio_url = data.portfolio_url
    if (data.graduation_year !== undefined && data.graduation_year !== '') {
      updatePayload.graduation_year = parseInt(data.graduation_year)
    }

    updatePayload.updated_at = new Date()

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: updatePayload
    })

    return NextResponse.json({
      success: true,
      message: 'Academic profile updated successfully',
      student: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        college: updated.college,
        degree: updated.degree,
        cgpa: updated.cgpa ? Number(updated.cgpa) : null,
        tenth_marks: updated.tenthMarks ? Number(updated.tenthMarks) : null,
        tenthMarks: updated.tenthMarks ? Number(updated.tenthMarks) : null,
        twelfth_marks: updated.twelfthMarks ? Number(updated.twelfthMarks) : null,
        twelfthMarks: updated.twelfthMarks ? Number(updated.twelfthMarks) : null
      }
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile', message: error?.message }, { status: 500 })
  }
}

