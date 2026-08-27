import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import {
  extractResumeText,
  normalizeFileType,
  isSupportedDocumentOrImage
} from '@/lib/resumeExtractor'
import { analyzeResumeWithGroq } from '@/lib/groqService'
import {
  BUCKETS,
  uploadToSupabaseStorage,
  getSupabaseAdmin,
} from '@/lib/supabaseStorage'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('resume') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!isSupportedDocumentOrImage(file.name, file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF, PNG, JPG, JPEG, or WEBP file.' }, { status: 400 })
    }

    const normalizedType = normalizeFileType(file.name, file.type)
    let extractedText = await extractResumeText(file)
    if (!extractedText || extractedText.trim().length < 10) {
      extractedText = `Resume file: ${file.name} - Extracted profile details and candidate skills summary.`
    }

    const analysis = await analyzeResumeWithGroq(extractedText)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
    const storagePath = `student_${session.userId}/${safeFileName}`

    let filePath = `/uploads/resumes/${session.userId}_${safeFileName}`

    // 1. Upload to Supabase Storage
    try {
      const supabase = getSupabaseAdmin()
      if (supabase) {
        const uploadResult = await uploadToSupabaseStorage(
          BUCKETS.RESUMES,
          storagePath,
          buffer,
          normalizedType
        )
        if (uploadResult) {
          filePath = `supabase:${BUCKETS.RESUMES}/${storagePath}`
          console.log(`[Supabase Storage] Saved resume: ${BUCKETS.RESUMES}/${storagePath}`)
        }
      }
    } catch (supabaseError) {
      console.error('[Supabase Storage] Resume upload fallback to local:', supabaseError)
    }

    // 2. Local fallback if not saved to Supabase
    if (!filePath.startsWith('supabase:')) {
      const uploadDir = join(process.cwd(), 'public/uploads/resumes')
      await mkdir(uploadDir, { recursive: true })
      const filename = `${session.userId}_${safeFileName}`
      const localFilepath = join(uploadDir, filename)
      await writeFile(localFilepath, buffer)
      filePath = `/uploads/resumes/${filename}`
    }

    const result = await prisma.resume.create({
      data: {
        studentId: session.userId,
        filename: file.name,
        filePath,
        extractedText: extractedText,
        analysisData: JSON.stringify(analysis),
        atsScore: analysis.ats_score || 0,
        overallRating: analysis.overall_rating || 0,
      },
    })

    return NextResponse.json({
      success: true,
      resumeId: result.id,
      analysis,
      extractedText: extractedText.substring(0, 500) + '...',
    })
  } catch (error: any) {
    console.error('Resume upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process resume' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resumes = await prisma.resume.findMany({
      where: { studentId: session.userId },
      select: {
        id: true,
        filename: true,
        filePath: true,
        atsScore: true,
        overallRating: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const mappedResumes = resumes.map((r: any) => ({
      ...r,
      ats_score: r.atsScore,
      overall_rating: r.overallRating,
      created_at: r.createdAt,
      download_url: `/api/resume/${r.id}/download`,
    }))

    return NextResponse.json({ resumes: mappedResumes })
  } catch (error: any) {
    console.error('Fetch resumes error:', error)
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 })
  }
}
