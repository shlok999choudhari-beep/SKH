import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { extractAndSaveAcademicMarksheet } from '@/lib/marksheetExtractionService'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: rawId } = await context.params
    const id = parseInt(rawId, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid marksheet ID' }, { status: 400 })
    }

    // 1. Locate either AcademicMarksheet or Document
    let marksheet = await prisma.academicMarksheet.findUnique({
      where: { id },
      include: { document: true }
    })

    let documentId: number
    let studentId: number
    let educationLevelHint: 'TENTH' | 'TWELFTH' | undefined

    if (marksheet) {
      studentId = marksheet.studentId
      educationLevelHint = marksheet.educationLevel as 'TENTH' | 'TWELFTH'
      if (!marksheet.documentId) {
        return NextResponse.json({ error: 'No document file attached to this marksheet record' }, { status: 400 })
      }
      documentId = marksheet.documentId
    } else {
      // Check if ID is a document ID
      const doc = await prisma.document.findUnique({
        where: { id },
        include: { academicMarksheet: true }
      })
      if (!doc) {
        return NextResponse.json({ error: 'Marksheet document not found' }, { status: 404 })
      }
      documentId = doc.id
      studentId = doc.studentId
      educationLevelHint = doc.documentType === '12th Marksheet' ? 'TWELFTH' : 'TENTH'
    }

    // 2. Enforce Access Control: Must be the owning student or an institution admin
    if (session.role === 'student' && session.userId !== studentId) {
      return NextResponse.json({ error: 'Forbidden: You cannot process another student\'s document' }, { status: 403 })
    }

    if (session.role !== 'student' && session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // 3. Trigger structured academic marksheet extraction
    const result = await extractAndSaveAcademicMarksheet(documentId, studentId, educationLevelHint)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Marksheet extraction failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Marksheet extracted and structured successfully',
      marksheet: result.marksheet
    })

  } catch (error: any) {
    console.error('Process marksheet error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
