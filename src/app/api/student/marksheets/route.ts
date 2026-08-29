import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { saveToVault } from '@/lib/storage'
import { normalizeFileType, isSupportedDocumentOrImage } from '@/lib/resumeExtractor'
import { computeDocumentHash, logDocumentActivity } from '@/lib/documentSecurityService'
import { z } from 'zod'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

const marksheetUploadSchema = z.object({
  educationLevel: z.enum(['TENTH', 'TWELFTH']),
  board: z.string().max(100).optional(),
  passingYear: z.coerce.number().int().min(1970).max(2035).optional(),
  rollNumber: z.string().max(50).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 401 })
    }

    const marksheets = await prisma.academicMarksheet.findMany({
      where: { studentId: session.userId },
      include: {
        document: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            verificationStatus: true,
            processingStatus: true,
            verificationScore: true,
            uploadedAt: true,
            rejectionReason: true,
            ocrResult: {
              select: { confidence: true, pageCount: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      marksheets
    })
  } catch (error: any) {
    console.error('Fetch student marksheets error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized: Student access required' }, { status: 401 })
    }

    const studentId = session.userId

    // Parse multipart/form-data
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'A valid marksheet file is required' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum 20MB limit' }, { status: 400 })
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 })
    }

    // Validate MIME type / extension
    if (!isSupportedDocumentOrImage(file.name, file.type)) {
      return NextResponse.json({
        error: 'Invalid file format. Please upload a PDF, PNG, JPG, JPEG, or WEBP marksheet.'
      }, { status: 400 })
    }

    const rawEducationLevel = ((formData.get('educationLevel') as string) || '').trim().toUpperCase()
    const validatedMeta = marksheetUploadSchema.parse({
      educationLevel: rawEducationLevel,
      board: (formData.get('board') as string) || undefined,
      passingYear: formData.get('passingYear') || undefined,
      rollNumber: (formData.get('rollNumber') as string) || undefined
    })

    const educationLevel = validatedMeta.educationLevel
    const documentType = educationLevel === 'TENTH' ? '10th Marksheet' : '12th Marksheet'
    const normalizedType = normalizeFileType(file.name, file.type)

    // Read buffer and compute cryptographic hash
    const arrayBuffer = await file.arrayBuffer()
    const rawBuffer = Buffer.from(arrayBuffer)
    const sha256Hash = computeDocumentHash(rawBuffer)

    // Save to private vault storage
    const filePath = await saveToVault(studentId, file.name, rawBuffer, normalizedType)

    // Fetch student's institution for document linking
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true, college: true, institutionId: true }
    })

    const publicVerificationId = `PIQ-ACAD-${educationLevel}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // 1. Create Document record in private vault
    const newDoc = await prisma.document.create({
      data: {
        studentId,
        institutionId: student?.institutionId || null,
        fileName: file.name,
        filePath,
        fileType: normalizedType,
        fileSize: file.size,
        documentType,
        category: 'Academic',
        description: `${educationLevel === 'TENTH' ? 'Class 10th (Secondary)' : 'Class 12th (Higher Secondary)'} official academic marksheet document.`,
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

    // 2. Upsert AcademicMarksheet record
    const existingMarksheet = await prisma.academicMarksheet.findFirst({
      where: {
        studentId,
        educationLevel
      }
    })

    let academicMarksheet
    if (existingMarksheet) {
      academicMarksheet = await prisma.academicMarksheet.update({
        where: { id: existingMarksheet.id },
        data: {
          documentId: newDoc.id,
          studentName: student?.name || null,
          board: validatedMeta.board || existingMarksheet.board,
          passingYear: validatedMeta.passingYear || existingMarksheet.passingYear,
          rollNumber: validatedMeta.rollNumber || existingMarksheet.rollNumber,
          verificationStatus: 'PENDING',
          verifiedAt: null,
          mismatchReason: null,
          comparisonResults: null,
          nameMatch: null,
          rollNumberMatch: null,
          boardMatch: null,
          yearMatch: null,
          marksMatch: null
        }
      })
    } else {
      academicMarksheet = await prisma.academicMarksheet.create({
        data: {
          studentId,
          documentId: newDoc.id,
          educationLevel,
          studentName: student?.name || null,
          board: validatedMeta.board || null,
          passingYear: validatedMeta.passingYear || null,
          rollNumber: validatedMeta.rollNumber || null,
          verificationStatus: 'PENDING'
        }
      })
    }

    // 3. Log security activity trail
    await logDocumentActivity({
      documentId: newDoc.id,
      actorId: studentId,
      actorName: student?.name || 'Student',
      actorRole: 'student',
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded ${educationLevel} academic marksheet (${file.name}, ${normalizedType}). Stored in private vault.`,
      status: 'SUCCESS'
    })

    // 4. Trigger asynchronous background verification & OCR pipeline
    ;(async () => {
      try {
        const { executeDocumentVerificationPipeline } = await import('@/lib/verificationService')
        await executeDocumentVerificationPipeline(
          newDoc.id,
          studentId,
          rawBuffer,
          file.name,
          normalizedType,
          'Academic',
          documentType,
          student ? { id: student.id, name: student.name, email: student.email, college: student.college } : undefined
        )
      } catch (bgErr) {
        console.error(`[Background Verification] Marksheet ${newDoc.id} error:`, bgErr)
        await prisma.document.update({
          where: { id: newDoc.id },
          data: { verificationStatus: 'UNDER_REVIEW', processingStatus: 'FAILED' }
        }).catch(() => {})
      }
    })()

    // 5. Return safe metadata
    return NextResponse.json({
      success: true,
      message: `${educationLevel === 'TENTH' ? '10th' : '12th'} marksheet uploaded successfully. Verification in progress.`,
      marksheet: {
        id: academicMarksheet.id,
        educationLevel: academicMarksheet.educationLevel,
        verificationStatus: academicMarksheet.verificationStatus,
        documentId: newDoc.id,
        fileName: newDoc.fileName,
        fileType: newDoc.fileType,
        fileSize: newDoc.fileSize,
        uploadedAt: newDoc.uploadedAt,
        publicVerificationId: newDoc.publicVerificationId
      }
    }, { status: 201 })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Marksheet upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload marksheet' }, { status: 500 })
  }
}
