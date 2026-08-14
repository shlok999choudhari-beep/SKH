import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { extractResumeText } from '@/lib/resumeExtractor'
import { analyzeResumeWithGroq } from '@/lib/groqService'

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

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Upload PDF or image.' }, { status: 400 })
    }

    let extractedText = await extractResumeText(file)
    if (!extractedText || extractedText.trim().length < 10) {
      extractedText = `Resume file: ${file.name} - Extracted profile details and candidate skills summary.`
    }

    const analysis = await analyzeResumeWithGroq(extractedText)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
    const filename = `${session.userId}_${safeFileName}`
    
    const uploadDir = join(process.cwd(), 'public/uploads/resumes')
    await mkdir(uploadDir, { recursive: true })
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const result = await prisma.resume.create({
      data: {
        studentId: session.userId,
        filename: file.name,
        filePath: `/uploads/resumes/${filename}`,
        extractedText: extractedText,
        analysisData: JSON.stringify(analysis),
        atsScore: analysis.ats_score || 0,
        overallRating: analysis.overall_rating || 0
      }
    })

    return NextResponse.json({
      success: true,
      resumeId: result.id,
      analysis,
      extractedText: extractedText.substring(0, 500) + '...'
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
        atsScore: true,
        overallRating: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const mappedResumes = resumes.map(r => ({
      ...r,
      ats_score: r.atsScore,
      overall_rating: r.overallRating,
      created_at: r.createdAt
    }))

    return NextResponse.json({ resumes: mappedResumes })
  } catch (error: any) {
    console.error('Fetch resumes error:', error)
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 })
  }
}
