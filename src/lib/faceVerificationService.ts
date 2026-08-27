import axios from 'axios'
import FormData from 'form-data'
import { prisma } from './prisma'

const DOCLING_SERVICE_URL = process.env.DOCLING_SERVICE_URL || 'http://127.0.0.1:8000'

export interface FaceVerificationResultData {
  status: 'MATCH' | 'NO_MATCH' | 'NO_FACE' | 'MULTIPLE_FACES' | 'LOW_QUALITY' | 'NOT_REQUESTED'
  similarityScore: number // 0 to 100
  profilePhotoFound: boolean
  documentPhotoFound: boolean
  details: string
}

/**
 * DeepFace Identity Verification Service
 * Privacy-first: No biometric embeddings stored in database.
 * Does NOT auto-reject on face discrepancy; marks for manual review.
 */
export async function performFaceVerification(
  documentId: number,
  studentId: number,
  documentBuffer: Buffer,
  profilePhotoBuffer?: Buffer | null,
  hasPhotoDetected: boolean = false
): Promise<FaceVerificationResultData> {
  // If no profile photo or no document photo detected, return neutral NOT_REQUESTED / NO_FACE
  if (!profilePhotoBuffer || profilePhotoBuffer.length === 0) {
    return {
      status: 'NOT_REQUESTED',
      similarityScore: 80.0, // neutral baseline
      profilePhotoFound: false,
      documentPhotoFound: hasPhotoDetected,
      details: 'Student profile photo not set. Face verification skipped.'
    }
  }

  if (!hasPhotoDetected) {
    return {
      status: 'NO_FACE',
      similarityScore: 85.0, // neutral baseline for standard non-photo documents
      profilePhotoFound: true,
      documentPhotoFound: false,
      details: 'No candidate photo present on this document (e.g. Standard Marksheet/Transcript).'
    }
  }

  // Call Python Microservice for Face Comparison
  try {
    const formData = new FormData()
    formData.append('documentFile', documentBuffer, {
      filename: 'document.jpg',
      contentType: 'image/jpeg'
    })
    formData.append('profileFile', profilePhotoBuffer, {
      filename: 'profile.jpg',
      contentType: 'image/jpeg'
    })

    const response = await axios.post(
      `${DOCLING_SERVICE_URL}/verify-identity`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024
      }
    )

    if (response.data?.verification) {
      const v = response.data.verification
      return {
        status: v.status || 'MATCH',
        similarityScore: typeof v.similarityScore === 'number' ? v.similarityScore : 75.0,
        profilePhotoFound: Boolean(v.profilePhotoFound),
        documentPhotoFound: Boolean(v.documentPhotoFound),
        details: v.details || 'Facial identity verification completed.'
      }
    }
  } catch (err: any) {
    console.warn('[FaceVerificationService] Microservice call fallback:', err.message)
  }

  // Graceful Fallback if model offline
  return {
    status: 'LOW_QUALITY',
    similarityScore: 70.0,
    profilePhotoFound: true,
    documentPhotoFound: hasPhotoDetected,
    details: 'Face verification service currently unavailable. Document routed for manual review.'
  }
}

/**
 * Persists Face Verification record to database
 */
export async function saveFaceVerification(
  documentId: number,
  studentId: number,
  result: FaceVerificationResultData
) {
  try {
    await prisma.faceVerification.deleteMany({ where: { documentId } })
    await prisma.faceVerification.create({
      data: {
        documentId,
        studentId,
        status: result.status,
        similarityScore: result.similarityScore,
        profilePhotoFound: result.profilePhotoFound,
        documentPhotoFound: result.documentPhotoFound,
        details: result.details
      }
    })
  } catch (err: any) {
    console.error('[FaceVerificationService] DB save error:', err.message)
  }
}
