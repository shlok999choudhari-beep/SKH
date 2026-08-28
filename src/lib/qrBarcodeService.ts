import axios from 'axios'
import FormData from 'form-data'
import { normalizeFileType } from './resumeExtractor'

const DOCLING_SERVICE_URL = process.env.DOCLING_SERVICE_URL || 'http://127.0.0.1:8000'

export interface QRCodeData {
  codeType: 'QR' | 'BARCODE'
  rawData: string
  certificateId?: string | null
  verificationUrl?: string | null
  matchStatus: 'MATCH' | 'MISMATCH' | 'NOT_PRESENT' | 'UNREADABLE'
  matchedWithOcr: boolean
}

export interface QRBarcodeAnalysisResult {
  hasQRCode: boolean
  hasBarcode: boolean
  qrStatus: 'QR_VALID' | 'QR_MISMATCH' | 'QR_NOT_PRESENT' | 'QR_UNREADABLE'
  barcodeStatus: 'BARCODE_VALID' | 'BARCODE_MISMATCH' | 'BARCODE_NOT_PRESENT'
  results: QRCodeData[]
  matchedCertificateId?: string | null
  verificationUrl?: string | null
}

/**
 * QR & Barcode Intelligence Service
 * Decodes 2D QR codes and 1D Barcodes, extracts certificate IDs/URLs,
 * and performs cross-validation against OCR-extracted text.
 */
export async function analyzeQRAndBarcodes(
  buffer: Buffer,
  fileName: string,
  fileType: string,
  ocrText: string = ''
): Promise<QRBarcodeAnalysisResult> {
  const normalizedType = normalizeFileType(fileName, fileType)
  let rawQRCodes: any[] = []

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

    if (response.data?.qrCodes) {
      rawQRCodes = response.data.qrCodes
    }
  } catch (err: any) {
    console.warn('[QRBarcodeService] Microservice call fallback:', err.message)
  }

  // Cross-compare decoded QR/Barcode with OCR text
  const cleanOcr = (ocrText || '').toLowerCase()
  const processedResults: QRCodeData[] = []
  let hasQR = false
  let hasBarcode = false
  let qrStatus: 'QR_VALID' | 'QR_MISMATCH' | 'QR_NOT_PRESENT' | 'QR_UNREADABLE' = 'QR_NOT_PRESENT'
  let barcodeStatus: 'BARCODE_VALID' | 'BARCODE_MISMATCH' | 'BARCODE_NOT_PRESENT' = 'BARCODE_NOT_PRESENT'
  let primaryCertId: string | null = null
  let primaryUrl: string | null = null

  for (const qr of rawQRCodes) {
    const isBarcode = qr.codeType === 'BARCODE'
    if (isBarcode) hasBarcode = true
    else hasQR = true

    const rawData = qr.rawData || ''
    const certId = qr.certificateId || null
    const url = qr.verificationUrl || null

    if (!primaryCertId && certId) primaryCertId = certId
    if (!primaryUrl && url) primaryUrl = url

    // Check if the QR data or certificate number appears in the OCR text
    let matched = false
    if (certId && cleanOcr.length > 0) {
      const cleanCert = certId.toLowerCase().replace(/[^a-z0-9]/g, '')
      const normalizedOcr = cleanOcr.replace(/[^a-z0-9]/g, '')
      if (normalizedOcr.includes(cleanCert) || cleanOcr.includes(certId.toLowerCase())) {
        matched = true
      }
    } else if (rawData && cleanOcr.length > 0 && cleanOcr.includes(rawData.toLowerCase())) {
      matched = true
    }

    const matchStatus: 'MATCH' | 'MISMATCH' | 'NOT_PRESENT' | 'UNREADABLE' = 
      matched ? 'MATCH' : (certId ? 'MISMATCH' : 'MATCH')

    processedResults.push({
      codeType: isBarcode ? 'BARCODE' : 'QR',
      rawData,
      certificateId: certId,
      verificationUrl: url,
      matchStatus,
      matchedWithOcr: matched
    })
  }

  if (hasQR) {
    const qrItem = processedResults.find(r => r.codeType === 'QR')
    if (qrItem) {
      qrStatus = qrItem.matchStatus === 'MATCH' ? 'QR_VALID' : 'QR_MISMATCH'
    }
  }

  if (hasBarcode) {
    const barcodeItem = processedResults.find(r => r.codeType === 'BARCODE')
    if (barcodeItem) {
      barcodeStatus = barcodeItem.matchStatus === 'MATCH' ? 'BARCODE_VALID' : 'BARCODE_MISMATCH'
    }
  }

  return {
    hasQRCode: hasQR,
    hasBarcode,
    qrStatus,
    barcodeStatus,
    results: processedResults,
    matchedCertificateId: primaryCertId,
    verificationUrl: primaryUrl
  }
}
