import axios from 'axios'
import FormData from 'form-data'
import { extractTextFromPDF, extractTextFromImage } from './resumeExtractor'

const DOCLING_SERVICE_URL = process.env.DOCLING_SERVICE_URL || 'http://127.0.0.1:8000'

export interface DoclingSection {
  title: string
  level: number
  text: string
}

export interface DoclingTable {
  tableIndex: number
  headers: string[]
  rows: string[][]
}

export interface DoclingExtractedFields {
  name?: string | null
  studentId?: string | null
  rollNumber?: string | null
  institution?: string | null
  documentType?: string | null
  dates?: string[] | null
  cgpaOrGrade?: string | null
  certificateNumber?: string | null
}

export interface DoclingExtractionResult {
  success: boolean
  fileName: string
  pages: number
  documentType: string
  text: string
  markdown: string
  sections: DoclingSection[]
  tables: DoclingTable[]
  fields: DoclingExtractedFields
  metadata: Record<string, any>
  error?: string
}

/**
 * Check if the Docling FastAPI service is online and healthy
 */
export async function checkDoclingHealth(): Promise<boolean> {
  try {
    const res = await axios.get(`${DOCLING_SERVICE_URL}/health`, { timeout: 2500 })
    return res.status === 200 && res.data?.status === 'ok'
  } catch {
    return false
  }
}

/**
 * Fallback extraction using built-in PDF/Image parsers if Docling service is offline
 */
async function fallbackLocalExtraction(
  buffer: Buffer,
  fileName: string,
  fileType: string,
  documentTypeHint?: string
): Promise<DoclingExtractionResult> {
  let text = ''
  try {
    if (fileType === 'application/pdf') {
      text = await extractTextFromPDF(buffer)
    } else if (fileType.startsWith('image/')) {
      text = await extractTextFromImage(buffer)
    }
  } catch (err) {
    console.error('Fallback extraction error:', err)
  }

  const cleanText = text.trim()
  const lower = cleanText.toLowerCase()
  let inferredType = documentTypeHint || 'Other'

  if (inferredType === 'Other') {
    if (lower.includes('resume') || (lower.includes('experience') && lower.includes('skills'))) {
      inferredType = 'Resume'
    } else if (lower.includes('marksheet') || lower.includes('grade card')) {
      inferredType = 'Marksheet'
    } else if (lower.includes('transcript')) {
      inferredType = 'Transcript'
    } else if (lower.includes('certificate')) {
      inferredType = 'Certificate'
    } else if (lower.includes('identity') || lower.includes('student id')) {
      inferredType = 'Identity Card'
    }
  }

  return {
    success: cleanText.length > 0,
    fileName,
    pages: 1,
    documentType: inferredType,
    text: cleanText,
    markdown: cleanText,
    sections: [
      {
        title: 'Document Content',
        level: 1,
        text: cleanText
      }
    ],
    tables: [],
    fields: {
      documentType: inferredType
    },
    metadata: {
      extractor: 'local-fallback',
      characterCount: cleanText.length
    }
  }
}

/**
 * Process document buffer using Docling microservice, with graceful fallback
 */
export async function extractWithDocling(
  buffer: Buffer,
  fileName: string,
  fileType: string,
  documentTypeHint?: string
): Promise<DoclingExtractionResult> {
  try {
    const isAvailable = await checkDoclingHealth()

    if (isAvailable) {
      const formData = new FormData()
      formData.append('file', buffer, {
        filename: fileName,
        contentType: fileType || 'application/pdf'
      })
      if (documentTypeHint) {
        formData.append('documentTypeHint', documentTypeHint)
      }

      const response = await axios.post<DoclingExtractionResult>(
        `${DOCLING_SERVICE_URL}/process-document`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 45000,
          maxContentLength: 50 * 1024 * 1024
        }
      )

      if (response.data && response.data.success) {
        return {
          ...response.data,
          metadata: {
            ...response.data.metadata,
            extractor: 'docling-service'
          }
        }
      }
    }
  } catch (error: any) {
    console.warn('[DoclingService] Microservice call failed, using fallback:', error?.message || error)
  }

  // Graceful fallback to local extraction
  return await fallbackLocalExtraction(buffer, fileName, fileType, documentTypeHint)
}
