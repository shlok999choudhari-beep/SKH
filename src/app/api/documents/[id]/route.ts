import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { deleteFromVault } from '@/lib/storage'
import { z } from 'zod'

const updateDocSchema = z.object({
  fileName: z.string().min(1).optional(),
  category: z.string().optional(),
  documentType: z.string().optional(),
  description: z.string().optional(),
  accessLevel: z.enum(['PRIVATE', 'INSTITUTION_ONLY', 'SHARED']).optional(),
  expiryDate: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const docId = parseInt(id, 10)
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        student: {
          select: { id: true, name: true, email: true, college: true }
        },
        institution: {
          select: { id: true, name: true }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check permissions
    if (session.role === 'student') {
      if (document.studentId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.role === 'institution-admin') {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { institutionId: true }
      })
      if (
        !user ||
        !user.institutionId ||
        user.institutionId !== document.institutionId ||
        document.accessLevel === 'PRIVATE'
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error: any) {
    console.error('Fetch document error:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const docId = parseInt(id, 10)
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const existingDoc = await prisma.document.findUnique({
      where: { id: docId }
    })

    if (!existingDoc || existingDoc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Document not found or forbidden' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateDocSchema.parse(body)

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        ...(validated.fileName ? { fileName: validated.fileName } : {}),
        ...(validated.category ? { category: validated.category } : {}),
        ...(validated.documentType ? { documentType: validated.documentType } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
        ...(validated.accessLevel ? { accessLevel: validated.accessLevel } : {}),
        ...(validated.expiryDate !== undefined
          ? { expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null }
          : {})
      }
    })

    return NextResponse.json({ success: true, document: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Update document error:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const docId = parseInt(id, 10)
    if (isNaN(docId)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const existingDoc = await prisma.document.findUnique({
      where: { id: docId }
    })

    if (!existingDoc || existingDoc.studentId !== session.userId) {
      return NextResponse.json({ error: 'Document not found or forbidden' }, { status: 404 })
    }

    // Delete file from vault storage
    if (existingDoc.filePath) {
      await deleteFromVault(existingDoc.filePath)
    }

    await prisma.document.delete({
      where: { id: docId }
    })

    return NextResponse.json({ success: true, message: 'Document deleted successfully' })
  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
