import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findUnique({
      where: { id: session.userId },
      select: {
        id: true, name: true, email: true, college: true, degree: true,
        graduationYear: true, phone: true, githubUrl: true, linkedinUrl: true,
        portfolioUrl: true, createdAt: true
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    
    // Map to expected JSON format
    const mappedStudent = {
      ...student,
      graduation_year: student.graduationYear,
      github_url: student.githubUrl,
      linkedin_url: student.linkedinUrl,
      portfolio_url: student.portfolioUrl,
      created_at: student.createdAt
    }

    return NextResponse.json(mappedStudent)
  } catch (error: any) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // If password is being updated, verify current password
    if (data.currentPassword && data.newPassword) {
      const student = await prisma.student.findUnique({
        where: { id: session.userId },
        select: { password: true }
      })
      
      if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

      const validPassword = await bcrypt.compare(data.currentPassword, student.password)
      
      if (!validPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10)
      await prisma.student.update({
        where: { id: session.userId },
        data: { password: hashedPassword }
      })
    }

    // Update other fields
    await prisma.student.update({
      where: { id: session.userId },
      data: {
        name: data.name,
        college: data.college,
        degree: data.degree,
        graduationYear: data.graduation_year ? parseInt(data.graduation_year, 10) : null,
        phone: data.phone,
        githubUrl: data.github_url,
        linkedinUrl: data.linkedin_url,
        portfolioUrl: data.portfolio_url
      }
    })

    return NextResponse.json({ success: true, message: 'Profile updated successfully' })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
