import axios from 'axios'
import FormData from 'form-data'

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
  email?: string | null
  phone?: string | null
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
  metadata: Record<string, unknown>
  error?: string
}

/**
 * Extract heuristic entities from raw text / OCR markdown
 */
function extractLocalFields(text: string): DoclingExtractedFields {
  const fields: DoclingExtractedFields = {}
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // 1. Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/)
  if (emailMatch) {
    fields.email = emailMatch[0].trim()
  }

  // 2. Phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?91[-.\s]?[6-9]\d{9}/)
  if (phoneMatch) {
    fields.phone = phoneMatch[0].trim()
  }

  // 3. Roll Number / Student ID / Registration
  const rollMatch = text.match(/(?:Roll\s*(?:No|Number|#)?|PRN|Registration\s*(?:No|Number)?|Student\s*ID)[:\s]+([A-Za-z0-9\-_/]{4,25})/i)
  if (rollMatch) {
    fields.rollNumber = rollMatch[1].trim()
    fields.studentId = rollMatch[1].trim()
  }

  // 4. Certificate / Document Number
  const certMatch = text.match(/(?:Certificate\s*(?:No|Number|ID)|Doc\s*(?:No|Number)|Enrollment\s*(?:No|Number))[:\s]+([A-Za-z0-9\-_/]{4,25})/i)
  if (certMatch) {
    fields.certificateNumber = certMatch[1].trim()
  }

  // 5. CGPA / Percentage / Grade
  const cgpaMatch = text.match(/(?:CGPA|SGPA|GPA|Percentage|Marks\s*Obtained)[:\s]+(\d+(?:\.\d+)?(?:\s*%)?(?:\s*\/\s*10(?:\.0)?)?)/i)
  if (cgpaMatch) {
    fields.cgpaOrGrade = cgpaMatch[1].trim()
  }

  // 6. Dates
  const dateMatches = text.match(/\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi)
  if (dateMatches) {
    fields.dates = Array.from(new Set(dateMatches)).slice(0, 5)
  }

  // 7. Institution
  const instMatch = text.match(/(?:University|Institute|College|Academy|School)\s+(?:of\s+)?[A-Za-z\s&,\.]{3,50}/i)
  if (instMatch) {
    fields.institution = instMatch[0].trim()
  }

  // 8. Name heuristic from top lines
  for (const line of lines.slice(0, 6)) {
    const cleanLine = line.replace(/^[#\*\-•\s]+/, '').trim()
    if (
      cleanLine.length >= 3 &&
      cleanLine.length <= 40 &&
      !cleanLine.includes('@') &&
      !cleanLine.includes('http') &&
      !/(?:resume|curriculum|phone|email|education|skills|page|date)/i.test(cleanLine) &&
      /^[A-Z][a-zA-Z\.\s]{2,35}$/.test(cleanLine)
    ) {
      fields.name = cleanLine
      break
    }
  }

  return fields
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
  const { extractTextFromPDF, extractTextFromImage, normalizeFileType } = await import('./resumeExtractor')
  const normalizedType = normalizeFileType(fileName, fileType)
  let text = ''

  try {
    if (normalizedType === 'application/pdf') {
      text = await extractTextFromPDF(buffer)
    } else if (normalizedType.startsWith('image/')) {
      text = await extractTextFromImage(buffer)
    } else {
      text = await extractTextFromImage(buffer)
      if (!text || text.trim().length < 15) {
        text = await extractTextFromPDF(buffer)
      }
    }
  } catch (err) {
    console.error('[DoclingService] Fallback local extraction error:', err)
  }

  const cleanText = text.trim()
  const lower = cleanText.toLowerCase()
  let inferredType = documentTypeHint || 'Other'

  if (inferredType === 'Other') {
    if (lower.includes('resume') || (lower.includes('experience') && lower.includes('skills')) || lower.includes('curriculum vitae')) {
      inferredType = 'Resume'
    } else if (lower.includes('marksheet') || lower.includes('grade card') || lower.includes('statement of marks')) {
      inferredType = 'Marksheet'
    } else if (lower.includes('transcript')) {
      inferredType = 'Transcript'
    } else if (lower.includes('certificate') || lower.includes('certify')) {
      inferredType = 'Certificate'
    } else if (lower.includes('identity') || lower.includes('student id') || lower.includes('roll no')) {
      inferredType = 'Identity Card'
    }
  }

  const localFields = extractLocalFields(cleanText)
  localFields.documentType = inferredType

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
    fields: localFields,
    metadata: {
      extractor: 'local-fallback',
      characterCount: cleanText.length,
      fileType: normalizedType
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
  const { normalizeFileType } = await import('./resumeExtractor')
  const normalizedType = normalizeFileType(fileName, fileType)

  try {
    const isAvailable = await checkDoclingHealth()

    if (isAvailable) {
      const formData = new FormData()
      formData.append('file', buffer, {
        filename: fileName,
        contentType: normalizedType
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.warn('[DoclingService] Microservice call failed, using fallback:', msg)
  }

  // Graceful fallback to local extraction
  return await fallbackLocalExtraction(buffer, fileName, normalizedType, documentTypeHint)
}

