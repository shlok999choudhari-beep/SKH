import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { saveToVault } from '@/lib/storage'
import { normalizeFileType, isSupportedDocumentOrImage } from '@/lib/resumeExtractor'
import { computeDocumentHash, logDocumentActivity } from '@/lib/documentSecurityService'
import {
  extractAndSaveAcademicMarksheet,
  validateMarksheetDocumentType,
  normalizeStudentName
} from '@/lib/marksheetExtractionService'
import { z } from 'zod'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

const uploadSchema = z.object({
  educationLevel: z.enum(['TENTH', 'TWELFTH'])
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized: Student login required' }, { status: 401 })
    }

    const studentId = session.userId

    // Check if student profile is already locked/verified
    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        college: true,
        institutionId: true,
        isAcademicLocked: true,
        academicVerificationStatus: true
      }
    })

    if (!currentStudent) {
      return NextResponse.json({ error: 'Student account not found' }, { status: 404 })
    }

    if (currentStudent.isAcademicLocked && currentStudent.academicVerificationStatus === 'VERIFIED') {
      return NextResponse.json({
        error: 'Your academic documents have already been verified and locked. Re-upload is not permitted.'
      }, { status: 403 })
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'A marksheet document file is required' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 20MB limit' }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 })
    }

    if (!isSupportedDocumentOrImage(file.name, file.type)) {
      return NextResponse.json({
        error: 'Invalid file format. Please upload a PDF, PNG, JPG, or JPEG marksheet.'
      }, { status: 400 })
    }

    const rawEducationLevel = ((formData.get('educationLevel') as string) || '').trim().toUpperCase()
    const { educationLevel } = uploadSchema.parse({ educationLevel: rawEducationLevel })
    const documentType = educationLevel === 'TENTH' ? '10th Marksheet' : '12th Marksheet'
    const normalizedType = normalizeFileType(file.name, file.type)

    // RE-UPLOAD CLEANUP:
    // Remove previous pending documents and marksheets for this educationLevel so no stale extraction remains
    const oldMarksheets = await prisma.academicMarksheet.findMany({
      where: { studentId, educationLevel },
      select: { id: true, documentId: true }
    })

    for (const oldM of oldMarksheets) {
      await prisma.academicMarksheet.delete({ where: { id: oldM.id } }).catch(() => {})
      if (oldM.documentId) {
        await prisma.extractedField.deleteMany({ where: { documentId: oldM.documentId } }).catch(() => {})
        await prisma.oCRResult.deleteMany({ where: { documentId: oldM.documentId } }).catch(() => {})
        await prisma.document.delete({ where: { id: oldM.documentId } }).catch(() => {})
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const rawBuffer = Buffer.from(arrayBuffer)
    const sha256Hash = computeDocumentHash(rawBuffer)

    // Save to private vault storage
    const filePath = await saveToVault(studentId, file.name, rawBuffer, normalizedType)
    const publicVerificationId = `PIQ-ACAD-${educationLevel}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // 1. Create new Document record in private vault
    const newDoc = await prisma.document.create({
      data: {
        studentId,
        institutionId: currentStudent.institutionId || null,
        fileName: file.name,
        filePath,
        fileType: normalizedType,
        fileSize: file.size,
        documentType,
        category: 'Academic',
        description: `${educationLevel === 'TENTH' ? 'Class 10th (Secondary)' : 'Class 12th (Higher Secondary)'} official academic marksheet.`,
        accessLevel: 'PRIVATE',
        verificationStatus: 'PROCESSING',
        processingStatus: 'PROCESSING',
        sha256Hash,
        version: 1,
        publicVerificationId,
        securityLevel: 'STANDARD',
        downloadPolicy: 'UNLIMITED'
      }
    })

    // 2. Perform Structured Academic Extraction
    const extractionResult = await extractAndSaveAcademicMarksheet(newDoc.id, studentId, educationLevel)

    if (!extractionResult.success || !extractionResult.marksheet) {
      await prisma.document.update({
        where: { id: newDoc.id },
        data: { verificationStatus: 'FAILED', processingStatus: 'FAILED' }
      })
      return NextResponse.json({
        error: extractionResult.error || 'Unable to extract information from this document. Please upload a clear official marksheet.',
        documentId: newDoc.id,
        fileName: file.name,
        fileType: normalizedType
      }, { status: 400 })
    }

    const marksheet = extractionResult.marksheet

    // 3. Document classification check
    if (marksheet.rawText) {
      const classification = validateMarksheetDocumentType(marksheet.rawText, educationLevel)
      if (!classification.isValid) {
        await prisma.document.update({
          where: { id: newDoc.id },
          data: { verificationStatus: 'FAILED', processingStatus: 'FAILED' }
        })
        return NextResponse.json({
          error: classification.message || `Please upload a valid ${educationLevel === 'TENTH' ? '10th' : '12th'} marksheet.`,
          documentId: newDoc.id,
          fileName: file.name,
          fileType: normalizedType
        }, { status: 400 })
      }
    }

    // 4. Validate extracted percentage
    if (marksheet.percentage === null || marksheet.percentage === undefined || marksheet.percentage <= 0 || marksheet.percentage > 100) {
      await prisma.document.update({
        where: { id: newDoc.id },
        data: { verificationStatus: 'FAILED', processingStatus: 'FAILED' }
      })
      return NextResponse.json({
        error: 'Unable to calculate percentage from the available subject marks. Please upload a clearer document.',
        documentId: newDoc.id,
        fileName: file.name,
        fileType: normalizedType
      }, { status: 422 })
    }

    // 5. Log Security Activity
    await logDocumentActivity({
      documentId: newDoc.id,
      actorId: studentId,
      actorName: marksheet.studentName || currentStudent.name || 'Student',
      actorRole: 'student',
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded and extracted ${educationLevel} marksheet: Name: ${marksheet.studentName || 'N/A'}, Percentage: ${marksheet.percentage}% (${marksheet.percentageSource === 'CALCULATED_FROM_SUBJECT_MARKS' ? 'Calculated from 5 subject marks' : 'Directly extracted'}), Board: ${marksheet.board || 'N/A'}, Year: ${marksheet.passingYear || 'N/A'}.`,
      status: 'SUCCESS'
    })

    return NextResponse.json({
      success: true,
      message: `${educationLevel === 'TENTH' ? '10th' : '12th'} marksheet extracted successfully.`,
      marksheet: {
        id: marksheet.id,
        documentId: newDoc.id,
        educationLevel,
        studentName: normalizeStudentName(marksheet.studentName),
        percentage: marksheet.percentage,
        percentageSource: marksheet.percentageSource || 'DIRECTLY_EXTRACTED',
        calculationEquation: marksheet.calculationEquation || null,
        calculationFormula: marksheet.calculationFormula || null,
        totalMarks: marksheet.totalMarks,
        obtainedMarks: marksheet.obtainedMarks,
        board: marksheet.board,
        passingYear: marksheet.passingYear,
        rollNumber: marksheet.rollNumber || marksheet.seatNumber,
        seatNumber: marksheet.seatNumber || marksheet.rollNumber,
        verificationStatus: 'EXTRACTED',
        ocrConfidence: marksheet.ocrConfidence,
        fileName: file.name,
        fileType: normalizedType,
        uploadedAt: newDoc.uploadedAt
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('Marksheet verification upload error:', error)
    return NextResponse.json({
      error: error.message || 'An error occurred while uploading and verifying the marksheet.'
    }, { status: 500 })
  }
}
