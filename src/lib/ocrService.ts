import axios from 'axios'
import FormData from 'form-data'
import { normalizeFileType } from './resumeExtractor'

const DOCLING_SERVICE_URL = process.env.DOCLING_SERVICE_URL || 'http://127.0.0.1:8000'

export interface OCRBoundingBox {
  box: number[][] // [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
  text: string
  confidence: number
  page: number
}

export interface OCRBlock {
  blockId: number
  text: string
  confidence: number
  page: number
  boundingBox?: number[][]
}

export interface OCRServiceResult {
  fullText: string
  blocks: OCRBlock[]
  boundingBoxes: OCRBoundingBox[]
  meanConfidence: number
  language: string
  pageCount: number
  engine: 'paddleocr' | 'tesseract' | 'none'
}

/**
 * Smart OCR Service
 * Primary: PaddleOCR via microservice with OpenCV deskewing/preprocessing
 * Fallback: Sharp + Tesseract.js isolated worker
 */
export async function performSmartOCR(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<OCRServiceResult> {
  const normalizedType = normalizeFileType(fileName, fileType)

  // 1. Try PaddleOCR through Python Microservice
  try {
    const formData = new FormData()
    formData.append('file', buffer, {
      filename: fileName,
      contentType: normalizedType
    })

    const response = await axios.post(
      `${DOCLING_SERVICE_URL}/process-document`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024
      }
    )

    if (response.data?.ocr && response.data.ocr.fullText) {
      const ocr = response.data.ocr
      return {
        fullText: ocr.fullText || '',
        blocks: ocr.blocks || [],
        boundingBoxes: ocr.boundingBoxes || [],
        meanConfidence: typeof ocr.meanConfidence === 'number' ? ocr.meanConfidence : 0.85,
        language: ocr.language || 'en',
        pageCount: response.data.pages || 1,
        engine: 'paddleocr'
      }
    }
  } catch (err: any) {
    console.warn('[SmartOCR] PaddleOCR microservice unavailable, using local Tesseract fallback:', err.message)
  }

  // 2. Fallback: Sharp + Tesseract.js
  let worker: any = null
  try {
    const { preprocessImageBuffer } = await import('./resumeExtractor')
    const enhancedBuffer = await preprocessImageBuffer(buffer)
    const { createWorker } = await import('tesseract.js')

    worker = await createWorker('eng', 1, {
      errorHandler: (e: any) => console.warn('[Tesseract Worker Error]', e)
    })

    const ocrPromise = worker.recognize(enhancedBuffer)
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('Tesseract fallback timeout after 15s')), 15000)
    )

    const ret = await Promise.race([ocrPromise, timeoutPromise])
    const rawText = ret?.data?.text || ''
    const confidence = (ret?.data?.confidence || 75) / 100

    // Construct structured lines and blocks
    const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean)
    const blocks: OCRBlock[] = lines.map((line: string, idx: number) => ({
      blockId: idx + 1,
      text: line,
      confidence: Math.min(1.0, Math.max(0.4, confidence)),
      page: 1,
      boundingBox: [[0, idx * 30], [500, idx * 30], [500, (idx + 1) * 30], [0, (idx + 1) * 30]]
    }))

    const boundingBoxes: OCRBoundingBox[] = blocks.map(b => ({
      box: b.boundingBox || [[0, 0], [0, 0], [0, 0], [0, 0]],
      text: b.text,
      confidence: b.confidence,
      page: 1
    }))

    return {
      fullText: rawText.trim(),
      blocks,
      boundingBoxes,
      meanConfidence: confidence,
      language: 'en',
      pageCount: 1,
      engine: 'tesseract'
    }
  } catch (tessErr: any) {
    console.error('[SmartOCR] Tesseract fallback failed:', tessErr)
    return {
      fullText: '',
      blocks: [],
      boundingBoxes: [],
      meanConfidence: 0.0,
      language: 'en',
      pageCount: 1,
      engine: 'none'
    }
  } finally {
    if (worker) {
      try {
        await worker.terminate()
      } catch {}
    }
  }
}
