import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { saveToVault } from '@/lib/storage'
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

    const where: any = {
      studentId: session.userId,
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (status && status !== 'ALL') {
      where.verificationStatus = status
    }

    if (accessLevel && accessLevel !== 'ALL') {
      where.accessLevel = accessLevel
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { documentType: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        parentDocument: {
          select: { id: true, fileName: true, version: true }
        }
      }
    })

    return NextResponse.json({ success: true, documents })
  } catch (error: any) {
    console.error('Fetch student documents error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
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
    }

    const validated = uploadDocSchema.parse(bodyData)

    // Retrieve student details to get institutionId
    const student = await prisma.student.findUnique({
      where: { id: session.userId },
      select: { institutionId: true }
    })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to private vault storage (Supabase Cloud Storage)
    const filePath = await saveToVault(session.userId, file.name, buffer, file.type)

    // Calculate version number if replacing/versioning existing document
    let version = 1
    if (validated.parentDocumentId) {
      const parent = await prisma.document.findUnique({
        where: { id: validated.parentDocumentId }
      })
      if (parent) {
        version = parent.version + 1
      }
    }

    const newDoc = await prisma.document.create({
      data: {
        studentId: session.userId,
        institutionId: student?.institutionId || null,
        fileName: validated.fileName,
        filePath,
        fileType: file.type,
        fileSize: file.size,
        documentType: validated.documentType,
        category: validated.category,
        description: validated.description || null,
        accessLevel: validated.accessLevel,
        verificationStatus: 'PENDING',
        qualityScore: validated.qualityScore ?? null,
        qualityResult: validated.qualityResult || null,
        extractedInformation: validated.extractedInformation || null,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        version,
        parentDocumentId: validated.parentDocumentId || null,
      }
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
