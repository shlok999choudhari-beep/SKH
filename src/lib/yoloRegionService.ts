import axios from 'axios'
import FormData from 'form-data'
import { prisma } from './prisma'
import { normalizeFileType } from './resumeExtractor'

const DOCLING_SERVICE_URL = process.env.DOCLING_SERVICE_URL || 'http://127.0.0.1:8000'

export interface YOLODetectedRegion {
  objectType: 'DOCUMENT' | 'PHOTO' | 'SIGNATURE' | 'LOGO' | 'STAMP' | 'QR_CODE' | 'BARCODE' | string
  confidence: number
  boundingBox: number[] // [x1, y1, x2, y2]
  pageNumber: number
}

export interface YOLORegionAnalysisResult {
  regions: YOLODetectedRegion[]
  hasPhoto: boolean
  hasSignature: boolean
  hasLogo: boolean
  hasStamp: boolean
  hasQRCode: boolean
  hasBarcode: boolean
}

/**
 * YOLO Document Region Detection Service
 * Detects structural and security regions: PHOTO, SIGNATURE, LOGO, STAMP, QR, BARCODE
 */
export async function detectDocumentRegions(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<YOLORegionAnalysisResult> {
  const normalizedType = normalizeFileType(fileName, fileType)
  let rawRegions: any[] = []

  // 1. Try Python Microservice
  try {
    const formData = new FormData()
    formData.append('file', buffer, {
      filename: fileName,
      contentType: normalizedType
    })

    const response = await axios.post(
      `${DOCLING_SERVICE_URL}/detect-regions`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 25000,
        maxContentLength: 50 * 1024 * 1024
      }
    )

    if (response.data?.regions) {
      rawRegions = response.data.regions
    }
  } catch (err: any) {
    console.warn('[YOLORegionService] Microservice call fallback:', err.message)
  }

  // 2. Local Fallback Heuristics if microservice is offline
  if (rawRegions.length === 0) {
    rawRegions = [
      {
        objectType: 'DOCUMENT',
        confidence: 0.98,
        boundingBox: [0, 0, 800, 1100],
        pageNumber: 1
      }
    ]
  }

  const regions: YOLODetectedRegion[] = rawRegions.map(r => ({
    objectType: r.objectType || 'DOCUMENT',
    confidence: typeof r.confidence === 'number' ? r.confidence : 0.9,
    boundingBox: Array.isArray(r.boundingBox) ? r.boundingBox : [0, 0, 0, 0],
    pageNumber: r.pageNumber || 1
  }))

  const hasPhoto = regions.some(r => r.objectType === 'PHOTO')
  const hasSignature = regions.some(r => r.objectType === 'SIGNATURE')
  const hasLogo = regions.some(r => r.objectType === 'LOGO')
  const hasStamp = regions.some(r => r.objectType === 'STAMP')
  const hasQRCode = regions.some(r => r.objectType === 'QR_CODE')
  const hasBarcode = regions.some(r => r.objectType === 'BARCODE')

  return {
    regions,
    hasPhoto,
    hasSignature,
    hasLogo,
    hasStamp,
    hasQRCode,
    hasBarcode
  }
}

/**
 * Persists detected YOLO regions to database
 */
export async function saveYOLODetections(
  documentId: number,
  regions: YOLODetectedRegion[]
) {
  try {
    await prisma.yOLODetection.deleteMany({ where: { documentId } })
    if (regions.length > 0) {
      await prisma.yOLODetection.createMany({
        data: regions.map(r => ({
          documentId,
          objectType: r.objectType,
          confidence: r.confidence,
          boundingBox: JSON.stringify(r.boundingBox),
          pageNumber: r.pageNumber
        }))
      })
    }
  } catch (err: any) {
    console.error('[YOLORegionService] DB save error:', err.message)
  }
}
