import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { compareStudentDocumentNames } from '@/lib/marksheetExtractionService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = session.userId

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        academicMarksheets: {
          include: {
            document: {
              select: {
                id: true,
                fileName: true,
                fileType: true,
                fileSize: true,
                verificationStatus: true,
                processingStatus: true,
                uploadedAt: true,
              }
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 })
    }

    const tenthMarksheet = student.academicMarksheets.find(m => m.educationLevel === 'TENTH')
    const twelfthMarksheet = student.academicMarksheets.find(m => m.educationLevel === 'TWELFTH')

    let nameComparison: any = null
    if (tenthMarksheet?.studentName && twelfthMarksheet?.studentName) {
      nameComparison = compareStudentDocumentNames(tenthMarksheet.studentName, twelfthMarksheet.studentName)
    }

    let verificationDataJson: any = {}
    if (student.academicVerificationData) {
      try {
        verificationDataJson = JSON.parse(student.academicVerificationData)
      } catch {}
    }

    let tenthCalcMeta: any = {}
    if (tenthMarksheet?.comparisonResults) {
      try { tenthCalcMeta = JSON.parse(tenthMarksheet.comparisonResults) } catch {}
    }

    let twelfthCalcMeta: any = {}
    if (twelfthMarksheet?.comparisonResults) {
      try { twelfthCalcMeta = JSON.parse(twelfthMarksheet.comparisonResults) } catch {}
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        college: student.college,
        degree: student.degree,
        tenthMarks: student.tenthMarks,
        twelfthMarks: student.twelfthMarks,
        tenthPercentageSource: student.tenthPercentageSource || tenthCalcMeta.percentageSource || 'DIRECTLY_EXTRACTED',
        twelfthPercentageSource: student.twelfthPercentageSource || twelfthCalcMeta.percentageSource || 'DIRECTLY_EXTRACTED',
        tenthBoard: student.tenthBoard || tenthMarksheet?.board,
        twelfthBoard: student.twelfthBoard || twelfthMarksheet?.board,
        tenthPassingYear: student.tenthPassingYear || tenthMarksheet?.passingYear,
        twelfthPassingYear: student.twelfthPassingYear || twelfthMarksheet?.passingYear,
        academicVerificationStatus: student.academicVerificationStatus || 'PENDING',
        academicVerifiedAt: student.academicVerifiedAt,
        isAcademicLocked: Boolean(student.isAcademicLocked),
        isFullyVerified
      },
      documents: {
        tenth: tenthMarksheet ? {
          id: tenthMarksheet.id,
          documentId: tenthMarksheet.documentId,
          educationLevel: 'TENTH',
          studentName: tenthMarksheet.studentName,
          percentage: tenthMarksheet.percentage,
          percentageSource: tenthCalcMeta.percentageSource || student.tenthPercentageSource || 'DIRECTLY_EXTRACTED',
          calculationEquation: tenthCalcMeta.calculationEquation || null,
          calculationFormula: tenthCalcMeta.calculationFormula || null,
          totalMarks: tenthMarksheet.totalMarks,
          obtainedMarks: tenthMarksheet.obtainedMarks,
          board: tenthMarksheet.board,
          passingYear: tenthMarksheet.passingYear,
          rollNumber: tenthMarksheet.rollNumber || tenthMarksheet.seatNumber,
          seatNumber: tenthMarksheet.seatNumber || tenthMarksheet.rollNumber,
          verificationStatus: tenthMarksheet.verificationStatus,
          ocrConfidence: tenthMarksheet.ocrConfidence,
          fileName: tenthMarksheet.document?.fileName,
          fileType: tenthMarksheet.document?.fileType,
          uploadedAt: tenthMarksheet.document?.uploadedAt
        } : null,
        twelfth: twelfthMarksheet ? {
          id: twelfthMarksheet.id,
          documentId: twelfthMarksheet.documentId,
          educationLevel: 'TWELFTH',
          studentName: twelfthMarksheet.studentName,
          percentage: twelfthMarksheet.percentage,
          percentageSource: twelfthCalcMeta.percentageSource || student.twelfthPercentageSource || 'DIRECTLY_EXTRACTED',
          calculationEquation: twelfthCalcMeta.calculationEquation || null,
          calculationFormula: twelfthCalcMeta.calculationFormula || null,
          totalMarks: twelfthMarksheet.totalMarks,
          obtainedMarks: twelfthMarksheet.obtainedMarks,
          board: twelfthMarksheet.board,
          passingYear: twelfthMarksheet.passingYear,
          rollNumber: twelfthMarksheet.rollNumber || twelfthMarksheet.seatNumber,
          seatNumber: twelfthMarksheet.seatNumber || twelfthMarksheet.rollNumber,
          verificationStatus: twelfthMarksheet.verificationStatus,
          ocrConfidence: twelfthMarksheet.ocrConfidence,
          fileName: twelfthMarksheet.document?.fileName,
          fileType: twelfthMarksheet.document?.fileType,
          uploadedAt: twelfthMarksheet.document?.uploadedAt
        } : null
      },
      nameComparison,
      canComplete: Boolean(
        tenthMarksheet &&
        twelfthMarksheet &&
        tenthMarksheet.percentage &&
        twelfthMarksheet.percentage &&
        (!nameComparison || nameComparison.isMatch)
      )
    })
  } catch (error: any) {
    console.error('Fetch academic verification status error:', error)
    return NextResponse.json({ error: 'Failed to retrieve academic verification status' }, { status: 500 })
  }
}
