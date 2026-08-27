import axios from 'axios'
import FormData from 'form-data'
import { normalizeFileType, isSupportedDocumentOrImage } from './resumeExtractor'

const DOCLING_SERVICE_URL = process.env.DOCLING_SERVICE_URL || 'http://127.0.0.1:8000'

export interface DocumentSection {
  title: string
  level: number
  text: string
}

export interface DocumentTable {
  tableIndex: number
  headers: string[]
  rows: string[][]
}

export interface ProcessedDocumentData {
  success: boolean
  fileName: string
  fileType: string
  pages: number
  documentType: string
  text: string
  markdown: string
  sections: DocumentSection[]
  tables: DocumentTable[]
  hasNativeText?: boolean
  metadata: Record<string, any>
  error?: string
}

/**
 * Checks if the Python Document Intelligence service is online
 */
export async function checkMicroserviceHealth(): Promise<boolean> {
  try {
    const res = await axios.get(`${DOCLING_SERVICE_URL}/health`, { timeout: 2000 })
    return res.status === 200 && res.data?.status === 'ok'
  } catch {
    return false
  }
}

/**
 * Modular Document Processor:
 * 1. Validates document format (PDF, PNG, JPG, JPEG, WEBP)
 * 2. Processes via Python Docling/PyMuPDF microservice if online
 * 3. Falls back to local Node.js parsing (pdf-parse / Sharp / Tesseract) if offline
 */
export async function processDocumentStructure(
  buffer: Buffer,
  fileName: string,
  fileType: string,
  documentTypeHint?: string
): Promise<ProcessedDocumentData> {
  const normalizedType = normalizeFileType(fileName, fileType)

  if (!isSupportedDocumentOrImage(fileName, fileType)) {
    return {
      success: false,
      fileName,
      fileType: normalizedType,
      pages: 1,
      documentType: documentTypeHint || 'Other',
      text: '',
      markdown: '',
      sections: [],
      tables: [],
      metadata: { error: 'Unsupported file format' },
      error: 'Unsupported file format. Please upload PDF, PNG, JPG, JPEG, or WEBP.'
    }
  }

  // 1. Try Python Microservice (Docling + PyMuPDF)
  try {
    const isOnline = await checkMicroserviceHealth()
    if (isOnline) {
      const formData = new FormData()
      formData.append('file', buffer, {
        filename: fileName,
        contentType: normalizedType
      })
      if (documentTypeHint) {
        formData.append('documentTypeHint', documentTypeHint)
      }

      const response = await axios.post(
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
          success: true,
          fileName: response.data.fileName || fileName,
          fileType: response.data.fileType || normalizedType,
          pages: response.data.pages || 1,
          documentType: response.data.documentType || documentTypeHint || 'Other',
          text: response.data.text || '',
          markdown: response.data.markdown || response.data.text || '',
          sections: response.data.sections || [],
          tables: response.data.tables || [],
          hasNativeText: response.data.metadata?.hasNativeText,
          metadata: {
            ...response.data.metadata,
            processor: 'docling-pymupdf-service'
          }
        }
      }
    }
  } catch (serviceErr: any) {
    console.warn('[DocumentProcessor] Microservice call fallback:', serviceErr.message)
  }

  // 2. Local Fallback (pdf-parse / local extractors)
  let text = ''
  try {
    if (normalizedType === 'application/pdf') {
      const { extractTextFromPDF } = await import('./resumeExtractor')
      text = await extractTextFromPDF(buffer)
    } else {
      const { extractTextFromImage } = await import('./resumeExtractor')
      text = await extractTextFromImage(buffer)
    }
  } catch (err: any) {
    console.error('[DocumentProcessor] Local fallback error:', err)
  }

  const cleanText = text.trim()
  return {
    success: cleanText.length > 0,
    fileName,
    fileType: normalizedType,
    pages: 1,
    documentType: documentTypeHint || 'Other',
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
    metadata: {
      processor: 'local-fallback',
      characterCount: cleanText.length
    }
  }
}
