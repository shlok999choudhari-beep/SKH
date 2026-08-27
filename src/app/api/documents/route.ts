import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { saveToVault } from '@/lib/storage'
import { normalizeFileType, isSupportedDocumentOrImage } from '@/lib/resumeExtractor'
import {
  encryptDocumentBuffer,
  hashDocumentPassword,
  computeDocumentHash,
  logDocumentActivity,
  generateShareToken
} from '@/lib/documentSecurityService'
import { z } from 'zod'

const uploadDocSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  category: z.string().default('Other'),
  documentType: z.string().default('Other'),
  description: z.string().optional(),
  accessLevel: z.enum(['PRIVATE', 'INSTITUTION_ONLY', 'SHARED']).default('PRIVATE'),
  expiryDate: z.string().optional(),
  requestId: z.string().optional(),
  qualityScore: z.coerce.number().optional(),
  qualityResult: z.string().optional(),
  extractedInformation: z.string().optional(),
  parentDocumentId: z.coerce.number().optional(),
  // Security Layer fields
  securityLevel: z.enum(['STANDARD', 'PROTECTED', 'HIGHLY_PROTECTED']).default('STANDARD'),
  password: z.string().optional(),
  isViewOnly: z.coerce.boolean().default(false),
  downloadPolicy: z.enum(['UNLIMITED', 'LIMITED', 'DISABLED']).default('UNLIMITED'),
  maxDownloads: z.coerce.number().optional(),
  accessExpiry: z.string().default('NEVER'),
  watermarkEnabled: z.coerce.boolean().default(false),
  watermarkText: z.string().optional(),
  versionNotes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const accessLevel = searchParams.get('accessLevel') || ''
    const securityLevel = searchParams.get('securityLevel') || ''

    const where: any = {
      studentId: session.userId,
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'VERIFIED', 'REJECTED', 'UNDER_REVIEW', 'SUSPICIOUS', 'NEEDS_REVIEW', 'FAILED']
    if (status && status !== 'ALL' && validStatuses.includes(status)) {
      where.verificationStatus = status
    }

    const validAccess = ['PRIVATE', 'INSTITUTION_ONLY', 'SHARED']
    if (accessLevel && accessLevel !== 'ALL' && validAccess.includes(accessLevel)) {
      where.accessLevel = accessLevel
    }

    const validSecurity = ['STANDARD', 'PROTECTED', 'HIGHLY_PROTECTED']
    if (securityLevel && securityLevel !== 'ALL' && validSecurity.includes(securityLevel)) {
      where.securityLevel = securityLevel
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { documentType: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    let documents: any[] = []
    try {
      documents = await prisma.document.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        include: {
          parentDocument: {
            select: { id: true, fileName: true, version: true }
          },
          childVersions: {
            select: { id: true, fileName: true, version: true, uploadedAt: true, versionNotes: true }
          },
          verification: true,
          ocrResult: {
            select: { confidence: true, engine: true, pageCount: true }
          },
          qrCodeResults: {
            select: { codeType: true, matchStatus: true, certificateId: true }
          }
        }
      })
    } catch (queryErr) {
      console.warn('Initial document findMany failed, falling back to simple query:', queryErr)
      try {
        documents = await prisma.document.findMany({
          where: { studentId: session.userId },
          orderBy: { uploadedAt: 'desc' }
        })
      } catch (fallbackErr) {
        console.error('Fallback query failed:', fallbackErr)
        return NextResponse.json({ success: true, documents: [] })
      }
    }

    // Safely attach active shares for each document
    let allShares: any[] = []
    try {
      if (documents.length > 0) {
        allShares = await (prisma as any).documentShare.findMany({
          where: {
            documentId: { in: documents.map((d: any) => d.id) },
            isRevoked: false
          },
          select: { id: true, documentId: true, shareToken: true, accessCount: true, maxAccessCount: true, expiresAt: true, isViewOnly: true }
        })
      }
    } catch (err) {
      console.warn('Shares query fallback:', err)
    }

    const documentsWithDetails = documents.map((doc: any) => {
      const docShares = allShares.filter((s: any) => s.documentId === doc.id)
      return {
        ...doc,
        shares: docShares,
        _count: {
          shares: docShares.length
        }
      }
    })

    return NextResponse.json({ success: true, documents: documentsWithDetails })
  } catch (error: any) {
    console.error('Fetch student documents error:', error)
    return NextResponse.json({ success: true, documents: [], error: (error?.message || 'Error loading documents') }, { status: 200 })
  }


}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!isSupportedDocumentOrImage(file.name, file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF, PNG, JPG, JPEG, or WEBP file.' }, { status: 400 })
    }

    const normalizedType = normalizeFileType(file.name, file.type)

    const rawSecurityLevel = (formData.get('securityLevel') as string) || 'STANDARD'
    const isViewOnly = formData.get('isViewOnly') === 'true' || formData.get('isViewOnly') === '1'
    const watermarkEnabled = formData.get('watermarkEnabled') === 'true' || formData.get('watermarkEnabled') === '1'
    const passwordInput = (formData.get('password') as string) || ''

    const bodyData = {
      fileName: (formData.get('fileName') as string) || file.name,
      category: (formData.get('category') as string) || 'Other',
      documentType: (formData.get('documentType') as string) || 'Other',
      description: (formData.get('description') as string) || '',
      accessLevel: (formData.get('accessLevel') as string) || 'PRIVATE',
      expiryDate: (formData.get('expiryDate') as string) || undefined,
      requestId: (formData.get('requestId') as string) || undefined,
      qualityScore: formData.get('qualityScore') || undefined,
      qualityResult: (formData.get('qualityResult') as string) || undefined,
      extractedInformation: (formData.get('extractedInformation') as string) || undefined,
      parentDocumentId: formData.get('parentDocumentId') || undefined,
      securityLevel: rawSecurityLevel,
      password: passwordInput,
      isViewOnly,
      downloadPolicy: (formData.get('downloadPolicy') as string) || 'UNLIMITED',
      maxDownloads: formData.get('maxDownloads') || undefined,
      accessExpiry: (formData.get('accessExpiry') as string) || 'NEVER',
      watermarkEnabled,
      watermarkText: (formData.get('watermarkText') as string) || undefined,
      versionNotes: (formData.get('versionNotes') as string) || undefined,
    }

    const validated = uploadDocSchema.parse(bodyData)

    // Retrieve student details to get institutionId and name
    const student = await prisma.student.findUnique({
      where: { id: session.userId },
      select: { institutionId: true, name: true, email: true }
    })

    const bytes = await file.arrayBuffer()
    const rawBuffer = Buffer.from(bytes)

    // 1. Calculate original document cryptographic fingerprint (SHA-256)
    const sha256Hash = computeDocumentHash(rawBuffer)

    // 2. Encryption at Rest if Protected or Highly Protected
    const shouldEncrypt = validated.securityLevel === 'PROTECTED' || validated.securityLevel === 'HIGHLY_PROTECTED'
    let bufferToStore: any = rawBuffer
    let encryptionIv: string | null = null
    let encryptionTag: string | null = null

    if (shouldEncrypt) {
      const encrypted = encryptDocumentBuffer(rawBuffer)
      bufferToStore = encrypted.encryptedBuffer
      encryptionIv = encrypted.iv
      encryptionTag = encrypted.tag
    }


    // 3. Password Hashing if password provided
    let passwordHash: string | null = null
    let isPasswordProtected = false
    if (validated.password && validated.password.trim().length > 0) {
      passwordHash = await hashDocumentPassword(validated.password.trim())
      isPasswordProtected = true
    }

    // 4. Save to private vault storage
    const filePath = await saveToVault(session.userId, file.name, bufferToStore, normalizedType)

    // 5. Calculate version number if replacing/versioning existing document
    let version = 1
    if (validated.parentDocumentId) {
      const parent = await prisma.document.findUnique({
        where: { id: validated.parentDocumentId }
      })
      if (parent) {
        version = parent.version + 1
      }
    }

    // 6. Calculate Access Expiry Date if set
    let computedExpiryDate: Date | null = null
    if (validated.accessExpiry === '1_HOUR') {
      computedExpiryDate = new Date(Date.now() + 60 * 60 * 1000)
    } else if (validated.accessExpiry === '24_HOURS') {
      computedExpiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    } else if (validated.accessExpiry === '7_DAYS') {
      computedExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    } else if (validated.expiryDate) {
      computedExpiryDate = new Date(validated.expiryDate)
    }

    const publicVerificationId = `PIQ-DOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    const newDoc = await prisma.document.create({
      data: {
        studentId: session.userId,
        institutionId: student?.institutionId || null,
        fileName: validated.fileName,
        filePath,
        fileType: normalizedType,
        fileSize: file.size,
        documentType: validated.documentType,
        category: validated.category,
        description: validated.description || null,
        accessLevel: validated.accessLevel,
        verificationStatus: 'PROCESSING',
        qualityScore: validated.qualityScore ?? null,
        qualityResult: validated.qualityResult || null,
        extractedInformation: validated.extractedInformation || null,
        sha256Hash,
        expiryDate: computedExpiryDate,
        version,
        parentDocumentId: validated.parentDocumentId || null,
        // Security fields
        securityLevel: validated.securityLevel,
        isEncrypted: shouldEncrypt,
        encryptionIv,
        encryptionTag,
        passwordHash,
        isPasswordProtected,
        isViewOnly: validated.isViewOnly || validated.securityLevel === 'HIGHLY_PROTECTED',
        downloadPolicy: validated.downloadPolicy,
        maxDownloads: validated.maxDownloads || (validated.downloadPolicy === 'LIMITED' ? 3 : null),
        downloadCount: 0,
        accessExpiry: validated.accessExpiry,
        watermarkEnabled: validated.watermarkEnabled || shouldEncrypt,
        watermarkText: validated.watermarkText || null,
        versionNotes: validated.versionNotes || null,
        publicVerificationId,
      }
    })

    // Log Activity Trail
    await logDocumentActivity({
      documentId: newDoc.id,
      actorId: session.userId,
      actorName: student?.name || 'Student',
      actorRole: 'student',
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded ${validated.fileName} (${validated.securityLevel} Security). Encryption: ${shouldEncrypt ? 'AES-256-GCM' : 'Standard'}. Password: ${isPasswordProtected ? 'Enabled' : 'None'}.`,
      status: 'SUCCESS'
    })

    // If linked to a document request, fulfill request
    if (validated.requestId) {
      const reqId = parseInt(validated.requestId, 10)
      if (!isNaN(reqId)) {
        await prisma.documentRequest.updateMany({
          where: {
            id: reqId,
            studentId: session.userId
          },
          data: {
            status: 'COMPLETED',
            documentId: newDoc.id,
            completedAt: new Date()
          }
        })
      }
    }

    // Asynchronous background processing with Phase 1 AI Document Intelligence Pipeline
    (async () => {
      try {
        const studentRecord = await prisma.student.findUnique({
          where: { id: session.userId },
          select: { id: true, name: true, email: true, college: true, degree: true, cgpa: true }
        })
        const { executeDocumentVerificationPipeline } = await import('@/lib/verificationService')
        await executeDocumentVerificationPipeline(
          newDoc.id,
          session.userId,
          rawBuffer,
          file.name,
          normalizedType,
          validated.category,
          validated.documentType,
          studentRecord || undefined
        )
      } catch (bgError) {
        console.error(`[Background Pipeline] Error processing doc ${newDoc.id}:`, bgError)
        await prisma.document.update({
          where: { id: newDoc.id },
          data: {
            verificationStatus: 'UNDER_REVIEW',
            processingStatus: 'FAILED'
          }
        }).catch(() => {})
      }
    })()

    return NextResponse.json({
      success: true,
      document: newDoc
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Upload document error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save document' }, { status: 500 })
  }
}

