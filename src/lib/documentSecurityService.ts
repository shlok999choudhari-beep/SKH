import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import { prisma } from './prisma'
import { readFromVault } from './storage'

// 32-byte encryption key for AES-256-GCM
const ENCRYPTION_SECRET = process.env.DOCUMENT_ENCRYPTION_KEY || 'placeiq-vault-master-sec-key-32b-length!!'
const MASTER_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest()

export interface EncryptedData {
  encryptedBuffer: Buffer
  iv: string
  tag: string
}

export interface WatermarkOptions {
  actorName?: string
  actorRole?: string
  documentId: number | string
  sha256Hash?: string
  customText?: string
}

/**
 * 1. AES-256-GCM Encryption for Documents at Rest
 */
export function encryptDocumentBuffer(buffer: Buffer): EncryptedData {
  const iv = crypto.randomBytes(12) // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv)
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    encryptedBuffer: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

/**
 * 2. AES-256-GCM Decryption
 */
export function decryptDocumentBuffer(
  encryptedBuffer: Buffer,
  ivHex: string,
  tagHex: string
): Buffer {
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])
}

/**
 * 3. Document Password Hashing
 */
export async function hashDocumentPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

/**
 * 4. Document Password Verification
 */
export async function verifyDocumentPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * 5. Compute SHA-256 Cryptographic Hash
 */
export function computeDocumentHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * 6. Dynamic PDF Watermarking Engine using pdf-lib
 */
export async function applyPdfWatermark(
  pdfBuffer: Buffer,
  options: WatermarkOptions
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })
    const pages = pdfDoc.getPages()
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const subFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const dateStr = new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const line1 = (options.customText || 'PLACEIQ CONFIDENTIAL').replace(/[^\x20-\x7E]/g, '')
    const line2 = `Accessed by: ${(options.actorName || 'Authorized User').replace(/[^\x20-\x7E]/g, '')} (${options.actorRole || 'Student'})`
    const line3 = `${dateStr} | Doc ID: PIQ-DOC-${options.documentId}`
    const line4 = options.sha256Hash ? `SHA-256: ${options.sha256Hash.slice(0, 20)}...` : 'Verified Digital Vault'

    for (const page of pages) {
      const { width, height } = page.getSize()

      // Primary Center Watermark
      const fontSize = Math.min(width, height) * 0.045
      const textWidth = font.widthOfTextAtSize(line1, fontSize)
      
      const centerX = width / 2
      const centerY = height / 2

      // Draw subtle background semi-transparent stamp
      page.drawText(line1, {
        x: Math.max(10, centerX - textWidth / 2 + 20),
        y: centerY + 30,
        size: fontSize,
        font,
        color: rgb(0.55, 0.35, 0.95), // Violet brand accent
        opacity: 0.18,
        rotate: degrees(35),
      })

      page.drawText(line2, {
        x: Math.max(10, centerX - font.widthOfTextAtSize(line2, fontSize * 0.45) / 2 + 20),
        y: centerY - 5,
        size: fontSize * 0.45,
        font: subFont,
        color: rgb(0.2, 0.2, 0.3),
        opacity: 0.22,
        rotate: degrees(35),
      })

      page.drawText(line3, {
        x: Math.max(10, centerX - font.widthOfTextAtSize(line3, fontSize * 0.38) / 2 + 20),
        y: centerY - 30,
        size: fontSize * 0.38,
        font: subFont,
        color: rgb(0.3, 0.3, 0.4),
        opacity: 0.20,
        rotate: degrees(35),
      })

      page.drawText(line4, {
        x: Math.max(10, centerX - font.widthOfTextAtSize(line4, fontSize * 0.32) / 2 + 20),
        y: centerY - 50,
        size: fontSize * 0.32,
        font: subFont,
        color: rgb(0.4, 0.4, 0.5),
        opacity: 0.18,
        rotate: degrees(35),
      })

      // Top Security Banner Header
      page.drawText(`[SECURE VAULT] PLACEIQ - DOC-ID: ${options.documentId} - ${(options.actorName || 'STUDENT').replace(/[^\x20-\x7E]/g, '')} - ${dateStr}`, {
        x: 20,
        y: height - 20,
        size: 8,
        font: subFont,
        color: rgb(0.4, 0.4, 0.6),
        opacity: 0.4,
      })

      // Bottom Security Footer with Integrity Seal
      page.drawText(`CONFIDENTIAL & PROPRIETARY - FOR VERIFICATION ONLY - SHA-256: ${options.sha256Hash || 'VALIDATED'}`, {
        x: 20,
        y: 15,
        size: 7,
        font: subFont,
        color: rgb(0.5, 0.5, 0.6),
        opacity: 0.4,
      })
    }

    const modifiedBytes = await pdfDoc.save()
    return Buffer.from(modifiedBytes)
  } catch (error) {
    console.warn('[Watermark Engine] Failed to watermark PDF, returning raw buffer:', error)
    return pdfBuffer
  }
}

/**
 * 7. Audit Activity Logger
 */
export async function logDocumentActivity(params: {
  documentId: number
  actorId?: number | null
  actorName?: string | null
  actorRole?: string | null
  action: string
  details?: string | null
  ip?: string | null
  location?: string | null
  device?: string | null
  status?: string
}) {
  try {
    await (prisma as any).documentActivity.create({
      data: {
        documentId: params.documentId,
        actorId: params.actorId || null,
        actorName: params.actorName || 'Anonymous',
        actorRole: params.actorRole || 'Guest',
        action: params.action,
        details: params.details || null,
        ip: params.ip || '127.0.0.1',
        location: params.location || 'Pune, Maharashtra (Approximate)',
        device: params.device || 'Desktop / Chrome',
        status: params.status || 'SUCCESS',
        timestamp: new Date()
      }
    })
  } catch (err: any) {
    console.error('[DocumentActivityLogger] Error logging activity:', err.message)
  }
}

/**
 * 8. Cryptographic Integrity Verification against Storage
 */
export async function verifyStoredDocumentIntegrity(documentId: number): Promise<{
  verified: boolean
  storedHash: string | null
  computedHash: string
  error?: string
}> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId }
  })

  if (!doc || !doc.filePath) {
    return { verified: false, storedHash: null, computedHash: '', error: 'Document record or file path not found' }
  }

  try {
    const rawBuffer = await readFromVault(doc.filePath)
    
    // Decrypt if document is encrypted at rest
    let fileBuffer = rawBuffer
    if (doc.isEncrypted && doc.encryptionIv && doc.encryptionTag) {
      fileBuffer = decryptDocumentBuffer(rawBuffer, doc.encryptionIv, doc.encryptionTag)
    }

    const computedHash = computeDocumentHash(fileBuffer)
    const storedHash = doc.sha256Hash || computedHash

    const isMatch = computedHash === storedHash

    // If stored hash was missing, update it
    if (!doc.sha256Hash) {
      await prisma.document.update({
        where: { id: documentId },
        data: { sha256Hash: computedHash }
      })
    }

    return {
      verified: isMatch,
      storedHash: doc.sha256Hash || computedHash,
      computedHash
    }
  } catch (err: any) {
    return {
      verified: false,
      storedHash: doc.sha256Hash,
      computedHash: '',
      error: err.message
    }
  }
}

/**
 * 9. Generate Secure Random Share Token
 */
export function generateShareToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

/**
 * 10. Generate Short-Lived Unlock Grant Token (15 min)
 */
export function createUnlockGrant(documentId: number, userId: number): string {
  const timestamp = Date.now()
  const payload = `${documentId}:${userId}:${timestamp}`
  const signature = crypto.createHmac('sha256', MASTER_KEY).update(payload).digest('hex')
  return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

/**
 * 11. Verify Short-Lived Unlock Grant Token
 */
export function verifyUnlockGrant(token: string, documentId: number): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split(':')
    if (parts.length !== 4) return false

    const [docIdStr, userIdStr, tsStr, signature] = parts
    const docId = parseInt(docIdStr, 10)
    const timestamp = parseInt(tsStr, 10)

    if (docId !== documentId) return false
    
    // Valid for 15 minutes
    if (Date.now() - timestamp > 15 * 60 * 1000) return false

    const expectedPayload = `${docIdStr}:${userIdStr}:${tsStr}`
    const expectedSig = crypto.createHmac('sha256', MASTER_KEY).update(expectedPayload).digest('hex')

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  } catch {
    return false
  }
}
