import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { downloadFromSupabaseStorage, BUCKETS } from '@/lib/supabaseStorage'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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
    const resumeId = parseInt(id, 10)
    if (isNaN(resumeId)) {
      return NextResponse.json({ error: 'Invalid resume ID' }, { status: 400 })
    }

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Check authorization: only the owner student or institution admin/company can view
    if (session.role === 'student' && resume.studentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let fileBuffer: Buffer | null = null
    const filePath = resume.filePath || ''

    // 1. Try fetching from Supabase Storage
    if (filePath.startsWith('supabase:')) {
      const withoutPrefix = filePath.replace(/^supabase:/, '')
      const slashIndex = withoutPrefix.indexOf('/')
      const bucket = withoutPrefix.slice(0, slashIndex)
      const storagePath = withoutPrefix.slice(slashIndex + 1)
      fileBuffer = await downloadFromSupabaseStorage(bucket, storagePath)
    } else if (filePath.startsWith('placeiq-resumes/')) {
      const storagePath = filePath.replace(/^placeiq-resumes\//, '')
      fileBuffer = await downloadFromSupabaseStorage(BUCKETS.RESUMES, storagePath)
    }

    // 2. Try fetching from local public folder fallback
    if (!fileBuffer) {
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
      const localFullPath = join(process.cwd(), 'public', cleanPath)
      if (existsSync(localFullPath)) {
        fileBuffer = await readFile(localFullPath)
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'Resume file could not be found' }, { status: 404 })
    }

    const downloadMode = request.nextUrl.searchParams.get('download') === 'true'
    const disposition = downloadMode ? 'attachment' : 'inline'
    const contentType = resume.filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(resume.filename)}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error: any) {
    console.error('Resume download/preview error:', error)
    return NextResponse.json({ error: 'Failed to access resume file' }, { status: 500 })
  }
}
