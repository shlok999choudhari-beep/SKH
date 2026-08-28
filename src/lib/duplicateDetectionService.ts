import crypto from 'crypto'
import axios from 'axios'
import FormData from 'form-data'
import { prisma } from './prisma'
import { normalizeFileType } from './resumeExtractor'

const DOCLING_SERVICE_URL = process.env.DOCLING_SERVICE_URL || 'http://127.0.0.1:8000'

export interface DuplicateHashes {
  sha256: string
  dhash: string
  phash: string
}

export interface DuplicateMatchInfo {
  matchedDocumentId: number
  matchedFileName: string
  matchType: 'EXACT' | 'VISUAL'
  similarityScore: number
  details: string
}

export interface DuplicateDetectionResult {
  hashes: DuplicateHashes
  isExactDuplicate: boolean
  isVisualDuplicate: boolean
  highestSimilarityScore: number
  duplicateCount: number
  matches: DuplicateMatchInfo[]
  summary: string
}

/**
 * Computes Hamming distance between two hex hash strings
 */
export function hammingDistanceHex(hex1: string, hex2: string): number {
  if (!hex1 || !hex2 || hex1.length !== hex2.length) return 64
  let dist = 0
  for (let i = 0; i < hex1.length; i++) {
    const v1 = parseInt(hex1[i], 16)
    const v2 = parseInt(hex2[i], 16)
    let xor = v1 ^ v2
    while (xor > 0) {
      dist += xor & 1
      xor >>= 1
    }
  }
  return dist
}

/**
 * Converts Hamming distance (0 - 64) to perceptual similarity percentage (0 - 100%)
 */
export function distanceToSimilarity(dist: number, maxBits: number = 64): number {
  const similarity = ((maxBits - dist) / maxBits) * 100
  return Math.round(Math.max(0, Math.min(100, similarity)))
}

/**
 * Calculates SHA-256 and Perceptual Hashes for a document buffer
 */
export async function computeDocumentHashes(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<DuplicateHashes> {
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
  const normalizedType = normalizeFileType(fileName, fileType)

  // 1. Try Python microservice for dHash / pHash
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

    if (response.data?.hashes) {
      return {
        sha256,
        dhash: response.data.hashes.dhash || '0'.repeat(16),
        phash: response.data.hashes.phash || '0'.repeat(16)
      }
    }
  } catch (err: any) {
    console.warn('[DuplicateService] Perceptual hash microservice fallback:', err.message)
  }

  // 2. Local fallback perceptual hash computation with Sharp
  let dhash = '0'.repeat(16)
  try {
    const sharpModule = await import('sharp')
    const sharp = sharpModule.default || sharpModule
    const resized = await sharp(buffer)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer()

    let dhashBits = ''
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const left = resized[row * 9 + col]
        const right = resized[row * 9 + col + 1]
        dhashBits += left > right ? '1' : '0'
      }
    }
    dhash = BigInt('0b' + dhashBits).toString(16).padStart(16, '0')
  } catch (localErr) {
    // If not a direct image, fallback to truncated sha256
    dhash = sha256.substring(0, 16)
  }

  return {
    sha256,
    dhash,
    phash: dhash
  }
}

/**
 * Checks for Exact and Visual duplicates against existing documents in the database
 */
export async function detectDuplicates(
  documentId: number,
  studentId: number,
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<DuplicateDetectionResult> {
  const hashes = await computeDocumentHashes(buffer, fileName, fileType)

  // Query existing documents (excluding current document ID)
  const existingDocs = await prisma.document.findMany({
    where: {
      id: { not: documentId },
      OR: [
        { sha256Hash: hashes.sha256 },
        { perceptualHash: { not: null } }
      ]
    },
    select: {
      id: true,
      fileName: true,
      studentId: true,
      sha256Hash: true,
      perceptualHash: true,
      uploadedAt: true
    },
    take: 50
  })

  const matches: DuplicateMatchInfo[] = []
  let isExact = false
  let isVisual = false
  let highestSim = 0

  for (const doc of existingDocs) {
    // Level 1: Exact SHA-256 match
    if (doc.sha256Hash && doc.sha256Hash.toLowerCase() === hashes.sha256.toLowerCase()) {
      isExact = true
      highestSim = 100
      matches.push({
        matchedDocumentId: doc.id,
        matchedFileName: doc.fileName,
        matchType: 'EXACT',
        similarityScore: 100,
        details: `Identical cryptographic SHA-256 match with document #${doc.id}`
      })
      continue
    }

    // Level 2: Visual perceptual hash comparison
    if (doc.perceptualHash && hashes.dhash && hashes.dhash !== '0'.repeat(16)) {
      const dist = hammingDistanceHex(hashes.dhash, doc.perceptualHash)
      const sim = distanceToSimilarity(dist, 64)

      if (sim >= 88) {
        if (sim > highestSim) highestSim = sim
        isVisual = true
        matches.push({
          matchedDocumentId: doc.id,
          matchedFileName: doc.fileName,
          matchType: 'VISUAL',
          similarityScore: sim,
          details: `Perceptual visual similarity of ${sim}% (Hamming distance ${dist})`
        })
      }
    }
  }

  let summary = 'No duplicate documents detected. Document is unique.'
  if (isExact) {
    summary = `Exact identical duplicate detected (100% SHA-256 match with existing document).`
  } else if (isVisual) {
    summary = `Possible visual duplicate detected (${highestSim}% similarity with existing document).`
  }

  return {
    hashes,
    isExactDuplicate: isExact,
    isVisualDuplicate: isVisual,
    highestSimilarityScore: highestSim,
    duplicateCount: matches.length,
    matches,
    summary
  }
}
