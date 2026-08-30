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
      where: { id: studentId },
      include: {
        academicMarksheets: {
          select: {
            id: true,
            educationLevel: true,
            verificationStatus: true,
            percentage: true,
            board: true,
            passingYear: true,
            verifiedAt: true,
            documentId: true
          }
        }
      }
    })

    if (!student) {
      student = await prisma.student.findFirst({
        include: {
          academicMarksheets: {
            select: {
              id: true,
              educationLevel: true,
              verificationStatus: true,
              percentage: true,
              board: true,
              passingYear: true,
              verifiedAt: true,
              documentId: true
            }
          }
        }
      })
    }

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    let verificationData: any = {}
    if (student.academicVerificationData) {
      try {
        verificationData = JSON.parse(student.academicVerificationData)
      } catch {}
    }

    const isLocked = Boolean(student.isAcademicLocked || student.academicVerificationStatus === 'VERIFIED')
    const tenthSheet = student.academicMarksheets?.find(m => m.educationLevel === 'TENTH')
    const twelfthSheet = student.academicMarksheets?.find(m => m.educationLevel === 'TWELFTH')

    const mappedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      college: student.college,
      degree: student.degree,
      phone: student.phone,
      cgpa: student.cgpa ? Number(student.cgpa) : null,
      tenth_marks: student.tenthMarks ? Number(student.tenthMarks) : (tenthSheet?.percentage ? Number(tenthSheet.percentage) : null),
      tenthMarks: student.tenthMarks ? Number(student.tenthMarks) : (tenthSheet?.percentage ? Number(tenthSheet.percentage) : null),
      twelfth_marks: student.twelfthMarks ? Number(student.twelfthMarks) : (twelfthSheet?.percentage ? Number(twelfthSheet.percentage) : null),
      twelfthMarks: student.twelfthMarks ? Number(student.twelfthMarks) : (twelfthSheet?.percentage ? Number(twelfthSheet.percentage) : null),
      tenthBoard: student.tenthBoard || tenthSheet?.board || null,
      twelfthBoard: student.twelfthBoard || twelfthSheet?.board || null,
      tenthPassingYear: student.tenthPassingYear || tenthSheet?.passingYear || null,
      twelfthPassingYear: student.twelfthPassingYear || twelfthSheet?.passingYear || null,
      tenthDocumentId: student.tenthDocumentId || tenthSheet?.documentId || null,
      twelfthDocumentId: student.twelfthDocumentId || twelfthSheet?.documentId || null,
      graduation_year: student.graduationYear,
      graduationYear: student.graduationYear,
      github_url: student.githubUrl,
      linkedin_url: student.linkedinUrl,
      portfolio_url: student.portfolioUrl,
      isAcademicLocked: isLocked,
      is_academic_locked: isLocked,
      academicVerificationStatus: student.academicVerificationStatus || 'PENDING',
      academic_verification_status: student.academicVerificationStatus || 'PENDING',
      academicVerifiedAt: student.academicVerifiedAt,
      academic_verified_at: student.academicVerifiedAt,
      nameVerified: Boolean(isLocked || verificationData.nameVerified),
      tenthPercentageVerified: Boolean(isLocked || verificationData.tenthPercentageVerified),
      twelfthPercentageVerified: Boolean(isLocked || verificationData.twelfthPercentageVerified),
      tenthMarksheetStatus: tenthSheet?.verificationStatus || (isLocked ? 'VERIFIED' : 'PENDING'),
      twelfthMarksheetStatus: twelfthSheet?.verificationStatus || (isLocked ? 'VERIFIED' : 'PENDING'),
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

    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!currentStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const isVerifiedLocked = Boolean(currentStudent.isAcademicLocked || currentStudent.academicVerificationStatus === 'VERIFIED')
    const data = await request.json()

    // If password update requested
    if (data.currentPassword && data.newPassword) {
      if (currentStudent.password) {
        let validPassword = false
        if (currentStudent.password.startsWith('$2a$') || currentStudent.password.startsWith('$2b$') || currentStudent.password.startsWith('$2y$')) {
          try {
            validPassword = await bcrypt.compare(data.currentPassword, currentStudent.password)
          } catch {
            validPassword = false
          }
        }
        if (!validPassword && currentStudent.password === data.currentPassword) {
          validPassword = true
        }

        if (validPassword) {
          const hashedPassword = await bcrypt.hash(data.newPassword, 12)
          await prisma.student.update({
            where: { id: studentId },
            data: { password: hashedPassword }
          })
        } else {
          return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 })
        }
      }
    }

    const updatePayload: Record<string, any> = {}

    // SECURITY ENFORCEMENT:
    // If account is verified and locked, prevent student from changing name, tenth marks, or twelfth marks
    if (!isVerifiedLocked) {
      if (data.name) updatePayload.name = data.name
      if (data.tenth_marks !== undefined && data.tenth_marks !== null && data.tenth_marks !== '') {
        updatePayload.tenthMarks = parseFloat(data.tenth_marks)
      } else if (data.tenthMarks !== undefined && data.tenthMarks !== null && data.tenthMarks !== '') {
        updatePayload.tenthMarks = parseFloat(data.tenthMarks)
      }
      if (data.twelfth_marks !== undefined && data.twelfth_marks !== null && data.twelfth_marks !== '') {
        updatePayload.twelfthMarks = parseFloat(data.twelfth_marks)
      } else if (data.twelfthMarks !== undefined && data.twelfthMarks !== null && data.twelfthMarks !== '') {
        updatePayload.twelfthMarks = parseFloat(data.twelfthMarks)
      }
    } else {
      // Ignore student tampering attempts on verified fields
      if (data.tenth_marks !== undefined || data.tenthMarks !== undefined || data.twelfth_marks !== undefined || data.twelfthMarks !== undefined) {
        console.warn(`[Security Alert] Student ${studentId} attempted to tamper with locked academic marks. Modification blocked.`)
      }
      if (data.name && data.name !== currentStudent.name) {
        console.warn(`[Security Alert] Student ${studentId} attempted to modify verified name. Modification blocked.`)
      }
    }

    // Editable general profile fields
    if (data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '') {
      updatePayload.cgpa = parseFloat(data.cgpa)
    }
    if (data.college) updatePayload.college = data.college
    if (data.degree) updatePayload.degree = data.degree
    if (data.phone !== undefined) updatePayload.phone = data.phone
    if (data.github_url !== undefined) updatePayload.githubUrl = data.github_url
    if (data.linkedin_url !== undefined) updatePayload.linkedinUrl = data.linkedin_url
    if (data.portfolio_url !== undefined) updatePayload.portfolioUrl = data.portfolio_url
    if (data.graduation_year !== undefined && data.graduation_year !== '') {
      updatePayload.graduationYear = parseInt(data.graduation_year)
    }

    updatePayload.updatedAt = new Date()

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: updatePayload
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
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
        twelfthMarks: updated.twelfthMarks ? Number(updated.twelfthMarks) : null,
        isAcademicLocked: Boolean(updated.isAcademicLocked)
      }
    })
  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile', message: error?.message }, { status: 500 })
  }
}
