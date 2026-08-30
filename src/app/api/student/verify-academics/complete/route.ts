import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { compareStudentDocumentNames, normalizeStudentName } from '@/lib/marksheetExtractionService'
import { logDocumentActivity } from '@/lib/documentSecurityService'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized: Student login required' }, { status: 401 })
    }

    const studentId = session.userId

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        academicMarksheets: {
          include: { document: true }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 })
    }

    const tenthMarksheet = student.academicMarksheets.find(m => m.educationLevel === 'TENTH')
    const twelfthMarksheet = student.academicMarksheets.find(m => m.educationLevel === 'TWELFTH')

    if (!tenthMarksheet || !tenthMarksheet.documentId || tenthMarksheet.percentage === null || tenthMarksheet.percentage === undefined) {
      return NextResponse.json({
        error: '10th Marksheet verification is incomplete. Please upload your 10th marksheet.'
      }, { status: 400 })
    }

    if (!twelfthMarksheet || !twelfthMarksheet.documentId || twelfthMarksheet.percentage === null || twelfthMarksheet.percentage === undefined) {
      return NextResponse.json({
        error: '12th Marksheet verification is incomplete. Please upload your 12th marksheet.'
      }, { status: 400 })
    }

    // Compare names extracted from 10th and 12th marksheets
    const tenthName = tenthMarksheet.studentName || ''
    const twelfthName = twelfthMarksheet.studentName || ''
    const nameComparison = compareStudentDocumentNames(tenthName, twelfthName)

    if (!nameComparison.isMatch) {
      // Set status to REVIEW_REQUIRED
      await prisma.student.update({
        where: { id: studentId },
        data: {
          academicVerificationStatus: 'REVIEW_REQUIRED',
          academicVerificationData: JSON.stringify({
            nameComparisonError: nameComparison.reason || 'Name mismatch detected between documents.',
            tenthName,
            twelfthName,
            tenthPercentage: tenthMarksheet.percentage,
            twelfthPercentage: twelfthMarksheet.percentage,
            flaggedAt: new Date().toISOString()
          })
        }
      })

      await prisma.academicMarksheet.updateMany({
        where: { studentId },
        data: {
          verificationStatus: 'REVIEW_REQUIRED',
          mismatchReason: nameComparison.reason || 'Name mismatch detected between 10th and 12th marksheets.'
        }
      })

      return NextResponse.json({
        error: 'Name mismatch detected between your documents. Your documents require verification by the institution.',
        status: 'REVIEW_REQUIRED',
        nameComparison
      }, { status: 422 })
    }

    // Name is verified and consistent
    const verifiedName = nameComparison.unifiedName || normalizeStudentName(tenthName) || normalizeStudentName(twelfthName) || student.name

    let tenthCalcMeta: any = {}
    if (tenthMarksheet.comparisonResults) {
      try { tenthCalcMeta = JSON.parse(tenthMarksheet.comparisonResults) } catch {}
    }

    let twelfthCalcMeta: any = {}
    if (twelfthMarksheet.comparisonResults) {
      try { twelfthCalcMeta = JSON.parse(twelfthMarksheet.comparisonResults) } catch {}
    }

    const tenthPercentageSource = tenthCalcMeta.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS' ? 'CALCULATED_FROM_SUBJECT_MARKS' : 'PERCENTAGE_EXTRACTED'
    const twelfthPercentageSource = twelfthCalcMeta.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS' ? 'CALCULATED_FROM_SUBJECT_MARKS' : 'PERCENTAGE_EXTRACTED'

    const verificationPayload = {
      nameVerified: true,
      tenthPercentageVerified: true,
      twelfthPercentageVerified: true,
      verifiedName,
      verifiedAt: new Date().toISOString(),
      tenthPercentage: tenthMarksheet.percentage,
      twelfthPercentage: twelfthMarksheet.percentage,
      tenthPercentageSource,
      twelfthPercentageSource,
      tenthCalculationEquation: tenthCalcMeta.calculationEquation || null,
      twelfthCalculationEquation: twelfthCalcMeta.calculationEquation || null,
      tenthBoard: tenthMarksheet.board,
      twelfthBoard: twelfthMarksheet.board,
      tenthPassingYear: tenthMarksheet.passingYear,
      twelfthPassingYear: twelfthMarksheet.passingYear,
      tenthDocumentId: tenthMarksheet.documentId,
      twelfthDocumentId: twelfthMarksheet.documentId
    }

    // 1. Update Student Profile: Lock verified data & make document the source of truth
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        name: verifiedName,
        tenthMarks: tenthMarksheet.percentage,
        twelfthMarks: twelfthMarksheet.percentage,
        tenthBoard: tenthMarksheet.board || student.tenthBoard,
        twelfthBoard: twelfthMarksheet.board || student.twelfthBoard,
        tenthPassingYear: tenthMarksheet.passingYear || student.tenthPassingYear,
        twelfthPassingYear: twelfthMarksheet.passingYear || student.twelfthPassingYear,
        tenthDocumentId: tenthMarksheet.documentId,
        twelfthDocumentId: twelfthMarksheet.documentId,
        tenthPercentageSource,
        twelfthPercentageSource,
        academicVerificationStatus: 'VERIFIED',
        academicVerifiedAt: new Date(),
        academicVerificationData: JSON.stringify(verificationPayload),
        isAcademicLocked: true,
        updatedAt: new Date()
      }
    })

    // 2. Mark Marksheets as VERIFIED
    await prisma.academicMarksheet.update({
      where: { id: tenthMarksheet.id },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        nameMatch: true,
        boardMatch: true,
        yearMatch: true,
        marksMatch: true
      }
    })

    await prisma.academicMarksheet.update({
      where: { id: twelfthMarksheet.id },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        nameMatch: true,
        boardMatch: true,
        yearMatch: true,
        marksMatch: true
      }
    })

    // 3. Mark Documents as VERIFIED
    if (tenthMarksheet.documentId) {
      await prisma.document.update({
        where: { id: tenthMarksheet.documentId },
        data: {
          verificationStatus: 'VERIFIED',
          processingStatus: 'COMPLETED',
          verifiedAt: new Date()
        }
      }).catch(() => {})

      await logDocumentActivity({
        documentId: tenthMarksheet.documentId,
        actorId: studentId,
        actorName: verifiedName,
        actorRole: 'student',
        action: 'ACADEMIC_VERIFIED',
        details: `10th Marksheet officially verified: ${tenthMarksheet.percentage}% (${tenthMarksheet.board || 'State Board'}, ${tenthMarksheet.passingYear || 'N/A'}).`,
        status: 'SUCCESS'
      })
    }

    if (twelfthMarksheet.documentId) {
      await prisma.document.update({
        where: { id: twelfthMarksheet.documentId },
        data: {
          verificationStatus: 'VERIFIED',
          processingStatus: 'COMPLETED',
          verifiedAt: new Date()
        }
      }).catch(() => {})

      await logDocumentActivity({
        documentId: twelfthMarksheet.documentId,
        actorId: studentId,
        actorName: verifiedName,
        actorRole: 'student',
        action: 'ACADEMIC_VERIFIED',
        details: `12th Marksheet officially verified: ${twelfthMarksheet.percentage}% (${twelfthMarksheet.board || 'State Board'}, ${twelfthMarksheet.passingYear || 'N/A'}).`,
        status: 'SUCCESS'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Academic document verification completed successfully. Your profile is now verified and locked.',
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        tenthMarks: updatedStudent.tenthMarks,
        twelfthMarks: updatedStudent.twelfthMarks,
        tenthBoard: updatedStudent.tenthBoard,
        twelfthBoard: updatedStudent.twelfthBoard,
        tenthPassingYear: updatedStudent.tenthPassingYear,
        twelfthPassingYear: updatedStudent.twelfthPassingYear,
        academicVerificationStatus: updatedStudent.academicVerificationStatus,
        academicVerifiedAt: updatedStudent.academicVerifiedAt,
        isAcademicLocked: updatedStudent.isAcademicLocked
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Complete academic verification error:', error)
    return NextResponse.json({
      error: error.message || 'An error occurred while completing academic verification.'
    }, { status: 500 })
  }
}
