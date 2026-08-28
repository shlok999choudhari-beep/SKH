import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { readFromVault } from '@/lib/storage'
import { normalizeFileType } from '@/lib/resumeExtractor'

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
      where: { id: docId }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check strict authorization
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
        return NextResponse.json({ error: 'Access denied: Private document or cross-institution attempt' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fileBuffer = await readFromVault(document.filePath)

    const downloadMode = request.nextUrl.searchParams.get('download') === 'true'
    const disposition = downloadMode ? 'attachment' : 'inline'
    const contentType = normalizeFileType(document.fileName, document.fileType)

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(document.fileName)}"`,
        'Cache-Control': 'private, max-age=3600',
      }
    })
  } catch (error: any) {
    console.error('Document download/preview error:', error)
    return NextResponse.json({ error: 'Failed to access document file' }, { status: 500 })
  }
}
