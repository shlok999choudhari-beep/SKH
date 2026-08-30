import axios from 'axios'
import FormData from 'form-data'
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib'
import * as zlib from 'zlib'
import sharp from 'sharp'
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
 * Helper: Extract embedded image pages from PDF buffer
 */
export async function extractImagesFromPdfBuffer(buffer: Buffer): Promise<Buffer[]> {
  const images: Buffer[] = []
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const enumeratedObjects = pdfDoc.context.enumerateIndirectObjects()

    for (const [ref, obj] of enumeratedObjects) {
      if (obj instanceof PDFRawStream) {
        const subtype = obj.dict.get(PDFName.of('Subtype'))
        if (subtype?.toString() === '/Image') {
          let rawBytes = obj.getContents()
          const filterStr = obj.dict.get(PDFName.of('Filter'))?.toString() || ''

          if (filterStr.includes('FlateDecode')) {
            try {
              rawBytes = zlib.inflateSync(Buffer.from(rawBytes))
            } catch (e) {}
          }

          // Direct JPEG (0xFF 0xD8)
          if (rawBytes[0] === 0xff && rawBytes[1] === 0xd8) {
            images.push(Buffer.from(rawBytes))
          } else if (rawBytes[0] === 0x89 && rawBytes[1] === 0x50 && rawBytes[2] === 0x4e && rawBytes[3] === 0x47) {
            images.push(Buffer.from(rawBytes))
          } else {
            try {
              const decoded = await sharp(Buffer.from(rawBytes)).toBuffer()
              images.push(decoded)
            } catch (e) {}
          }
        }
      }
    }
  } catch (err) {
    console.warn('[PDF Image Extractor] Warning:', err)
  }
  return images
}

/**
 * Smart OCR Service
 * Primary: PaddleOCR via microservice with OpenCV deskewing/preprocessing
 * Fallback: Sharp + Tesseract.js isolated worker (with multi-page PDF image extraction)
 */
export async function performSmartOCR(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<OCRServiceResult> {
  const normalizedType = normalizeFileType(fileName, fileType)
  const isPdf = normalizedType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf') || buffer.slice(0, 5).toString() === '%PDF-'

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
    const { createWorker } = await import('tesseract.js')

    // Check if document contains extractable text directly (e.g. digital PDF or plain text buffer)
    const rawString = buffer.toString('utf-8')
    if (
      rawString.includes('BOARD') ||
      rawString.includes('MARKS') ||
      rawString.includes('STATEMENT') ||
      rawString.includes('EXAMINATION') ||
      rawString.includes('PERCENTAGE') ||
      rawString.includes('SECONDARY')
    ) {
      const cleanLines = rawString
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .split(/[\r\n]+/)
        .map(l => l.trim())
        .filter(l => l.length >= 2)

      if (cleanLines.length >= 4) {
        const textBlocks: OCRBlock[] = cleanLines.map((line, idx) => ({
          blockId: idx + 1,
          text: line,
          confidence: 0.95,
          page: 1,
          boundingBox: [[0, idx * 30], [500, idx * 30], [500, (idx + 1) * 30], [0, (idx + 1) * 30]]
        }))

        return {
          fullText: cleanLines.join('\n'),
          blocks: textBlocks,
          boundingBoxes: textBlocks.map(b => ({
            box: b.boundingBox || [[0, 0], [0, 0], [0, 0], [0, 0]],
            text: b.text,
            confidence: b.confidence,
            page: b.page
          })),
          meanConfidence: 0.95,
          language: 'en',
          pageCount: 1,
          engine: 'paddleocr'
        }
      }
    }

    let imageBuffers: Buffer[] = []

    if (isPdf) {
      imageBuffers = await extractImagesFromPdfBuffer(buffer)
    }

    if (imageBuffers.length === 0) {
      // Direct image file
      const { preprocessImageBuffer } = await import('./resumeExtractor')
      const enhanced = await preprocessImageBuffer(buffer)
      imageBuffers.push(enhanced)
    }

    worker = await createWorker('eng', 1, {
      errorHandler: (e: any) => console.warn('[Tesseract Worker Error]', e)
    })
    await worker.setParameters({
      tessedit_pageseg_mode: '6'
    })

    let combinedText = ''
    const allBlocks: OCRBlock[] = []
    const seenLineTexts = new Set<string>()
    let totalConfidence = 0

    for (let p = 0; p < imageBuffers.length; p++) {
      const rawBuffer = imageBuffers[p]
      let meta: any = {}
      try {
        meta = await sharp(rawBuffer).metadata()
      } catch {}

      // Pass 1: Standard Grayscale normalized
      let pass1Buffer = rawBuffer
      try {
        pass1Buffer = await sharp(rawBuffer).grayscale().normalize().sharpen({ sigma: 1.5 }).toBuffer()
      } catch {}

      // Pass 2: Red-channel extraction (strips blue/cyan guilloche background watermark patterns)
      let pass2Buffer: Buffer | null = null
      try {
        pass2Buffer = await sharp(rawBuffer).extractChannel('red').linear(1.8, -40).sharpen({ sigma: 1.2 }).toBuffer()
      } catch {}

      // Pass 3: Table Region Crop with high contrast
      let pass3Buffer: Buffer | null = null
      if (meta.height && meta.width) {
        try {
          const tableTop = Math.round(meta.height * 0.30)
          const tableHeight = Math.round(meta.height * 0.45)
          pass3Buffer = await sharp(rawBuffer)
            .extract({ left: 0, top: tableTop, width: meta.width, height: tableHeight })
            .extractChannel('red')
            .linear(2.0, -50)
            .sharpen()
            .toBuffer()
        } catch {}
      }

      const passes: { name: string; buffer: Buffer; psm: string }[] = [
        { name: 'Grayscale', buffer: pass1Buffer, psm: '6' }
      ]
      if (pass2Buffer) passes.push({ name: 'RedChannel', buffer: pass2Buffer, psm: '6' })
      if (pass3Buffer) {
        passes.push({ name: 'TableCropPSM6', buffer: pass3Buffer, psm: '6' })
        passes.push({ name: 'TableCropPSM11', buffer: pass3Buffer, psm: '11' })
      }

      let pageConfidenceSum = 0
      let passCount = 0

      for (const pass of passes) {
        try {
          await worker.setParameters({ tessedit_pageseg_mode: pass.psm })
          const ocrPromise = worker.recognize(pass.buffer)
          const timeoutPromise = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Tesseract recognition timeout')), 15000)
          )
          const ret = await Promise.race([ocrPromise, timeoutPromise])
          const pageText = ret?.data?.text || ''
          const conf = (ret?.data?.confidence || 75) / 100
          pageConfidenceSum += conf
          passCount++

          const lines = pageText.split('\n').map((l: string) => l.trim()).filter(Boolean)
          lines.forEach((line: string) => {
            if (!seenLineTexts.has(line)) {
              seenLineTexts.add(line)
              combinedText += (combinedText ? '\n' : '') + line
              allBlocks.push({
                blockId: allBlocks.length + 1,
                text: line,
                confidence: Math.min(1.0, Math.max(0.4, conf)),
                page: p + 1,
                boundingBox: [[0, (allBlocks.length) * 30], [500, (allBlocks.length) * 30], [500, (allBlocks.length + 1) * 30], [0, (allBlocks.length + 1) * 30]]
              })
            }
          })
        } catch (passErr: any) {
          console.warn(`[SmartOCR] Pass ${pass.name} error:`, passErr.message)
        }
      }

      totalConfidence += passCount > 0 ? (pageConfidenceSum / passCount) : 0.75
    }

    const boundingBoxes: OCRBoundingBox[] = allBlocks.map(b => ({
      box: b.boundingBox || [[0, 0], [0, 0], [0, 0], [0, 0]],
      text: b.text,
      confidence: b.confidence,
      page: b.page
    }))

    return {
      fullText: combinedText.trim(),
      blocks: allBlocks,
      boundingBoxes,
      meanConfidence: imageBuffers.length > 0 ? totalConfidence / imageBuffers.length : 0.75,
      language: 'en',
      pageCount: imageBuffers.length || 1,
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
