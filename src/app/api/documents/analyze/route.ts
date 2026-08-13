import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { analyzeDocumentQuality } from '@/lib/documentQualityService'

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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await analyzeDocumentQuality(buffer, file.name, file.type)

    return NextResponse.json({
      success: true,
      analysis: result
    })
  } catch (error: any) {
    console.error('Document analysis error:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze document' }, { status: 500 })
  }
}
