import crypto from 'crypto'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { saveToVault } from '@/lib/storage'
import { prisma } from '@/lib/prisma'

export interface CertificateData {
  certificateId: string
  studentName: string
  courseTitle: string
  instructorName?: string | null
  institutionName?: string | null
  completionDate: Date
  verificationUrl: string
  finalScore?: number | null
}

/**
 * Generate collision-resistant unique certificate identifier
 * Format: PIQ-CERT-8F4A2C91
 */
export function generateCertificateId(): string {
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `PIQ-CERT-${randomHex}`
}

/**
 * Generate cryptographic verification token
 */
export function generateVerificationToken(certificateId: string, studentId: number, courseId: number): string {
  const payload = `${certificateId}:${studentId}:${courseId}:${Date.now()}`
  return crypto.createHash('sha256').update(payload).digest('hex')
}

/**
 * Generate high-res QR code Data URL and PNG buffer
 */
export async function generateCertificateQRCode(verificationUrl: string): Promise<{ dataUrl: string; pngBuffer: Buffer }> {
  const dataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  })

  const pngBuffer = await QRCode.toBuffer(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  })

  return { dataUrl, pngBuffer }
}

/**
 * Generate a PDF Certificate of Completion
 */
export async function generateCertificatePdf(data: CertificateData, qrPngBuffer: Buffer): Promise<Buffer> {
  // Create a new landscape PDF Document (842 x 595 - A4 Landscape)
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595])
  const { width, height } = page.getSize()

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontTimesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
  const fontTimesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  // Colors
  const darkNavy = rgb(0.06, 0.09, 0.16) // #0f172a
  const accentIndigo = rgb(0.39, 0.40, 0.95) // #6366f1
  const goldAccent = rgb(0.85, 0.65, 0.13) // #d97706
  const slateMuted = rgb(0.39, 0.45, 0.55) // #64748b
  const borderLight = rgb(0.88, 0.91, 0.94) // #e2e8f0

  // 1. Background Fill & Double Border
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.99, 1.0)
  })

  // Outer Border
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: goldAccent,
    borderWidth: 2,
    color: rgb(1, 1, 1)
  })

  // Inner Elegant Frame
  page.drawRectangle({
    x: 32,
    y: 32,
    width: width - 64,
    height: height - 64,
    borderColor: borderLight,
    borderWidth: 1
  })

  // Top Decorative Bar
  page.drawRectangle({
    x: 32,
    y: height - 42,
    width: width - 64,
    height: 10,
    color: darkNavy
  })

  // 2. Header Brand
  const brandTitle = 'PLACEIQ LEARNING HUB'
  const brandWidth = fontHelveticaBold.widthOfTextAtSize(brandTitle, 13)
  page.drawText(brandTitle, {
    x: (width - brandWidth) / 2,
    y: height - 80,
    size: 13,
    font: fontHelveticaBold,
    color: accentIndigo
  })

  // 3. Certificate of Completion Main Title
  const mainTitle = 'CERTIFICATE OF COMPLETION'
  const mainTitleWidth = fontTimesRomanBold.widthOfTextAtSize(mainTitle, 26)
  page.drawText(mainTitle, {
    x: (width - mainTitleWidth) / 2,
    y: height - 120,
    size: 26,
    font: fontTimesRomanBold,
    color: darkNavy
  })

  // Subtitle
  const subPrompt = 'THIS IS PROUDLY PRESENTED TO'
  const subWidth = fontHelvetica.widthOfTextAtSize(subPrompt, 9)
  page.drawText(subPrompt, {
    x: (width - subWidth) / 2,
    y: height - 150,
    size: 9,
    font: fontHelvetica,
    color: slateMuted
  })

  // 4. Student Name
  const studentNameUpper = data.studentName.toUpperCase()
  const nameWidth = fontTimesRomanBold.widthOfTextAtSize(studentNameUpper, 24)
  page.drawText(studentNameUpper, {
    x: (width - nameWidth) / 2,
    y: height - 195,
    size: 24,
    font: fontTimesRomanBold,
    color: darkNavy
  })

  // Underline beneath name
  page.drawLine({
    start: { x: (width - nameWidth) / 2 - 20, y: height - 205 },
    end: { x: (width + nameWidth) / 2 + 20, y: height - 205 },
    thickness: 1.5,
    color: goldAccent
  })

  // 5. Completion Narrative
  const narrative = 'for successfully mastering the curriculum and fulfilling all practical assessments of'
  const narrativeWidth = fontTimesRomanItalic.widthOfTextAtSize(narrative, 12)
  page.drawText(narrative, {
    x: (width - narrativeWidth) / 2,
    y: height - 240,
    size: 12,
    font: fontTimesRomanItalic,
    color: slateMuted
  })

  // 6. Course Title
  const courseTitle = data.courseTitle
  const courseWidth = fontHelveticaBold.widthOfTextAtSize(courseTitle, 18)
  page.drawText(courseTitle, {
    x: (width - courseWidth) / 2,
    y: height - 280,
    size: 18,
    font: fontHelveticaBold,
    color: accentIndigo
  })

  // 7. Embed Verification QR Code
  const qrImage = await pdfDoc.embedPng(qrPngBuffer)
  const qrSize = 90
  const qrX = width - 150
  const qrY = 60

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize
  })

  const scanVerify = 'Scan to Verify'
  const scanWidth = fontHelvetica.widthOfTextAtSize(scanVerify, 8)
  page.drawText(scanVerify, {
    x: qrX + (qrSize - scanWidth) / 2,
    y: qrY - 12,
    size: 8,
    font: fontHelvetica,
    color: slateMuted
  })

  // 8. Bottom Details & Signatures
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(data.completionDate))

  // Left side: Date & Certificate ID
  page.drawText('ISSUED ON', {
    x: 60,
    y: 115,
    size: 8,
    font: fontHelveticaBold,
    color: slateMuted
  })
  page.drawText(formattedDate, {
    x: 60,
    y: 95,
    size: 11,
    font: fontHelveticaBold,
    color: darkNavy
  })

  page.drawText(`Certificate ID: ${data.certificateId}`, {
    x: 60,
    y: 75,
    size: 9,
    font: fontHelvetica,
    color: slateMuted
  })

  // Middle: Institution / Instructor
  const instructor = data.instructorName || 'PlaceIQ Certified Instructor'
  const instName = data.institutionName || 'PlaceIQ Academic Division'

  page.drawText('VERIFIED INSTRUCTOR', {
    x: 340,
    y: 115,
    size: 8,
    font: fontHelveticaBold,
    color: slateMuted
  })
  page.drawText(instructor, {
    x: 340,
    y: 95,
    size: 11,
    font: fontHelveticaBold,
    color: darkNavy
  })
  page.drawText(instName, {
    x: 340,
    y: 75,
    size: 9,
    font: fontHelvetica,
    color: slateMuted
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

/**
 * Issue a Certificate upon Course Completion:
 * 1. Generates unique collision-resistant ID and Token.
 * 2. Generates verification URL and QR code.
 * 3. Builds branded PDF certificate.
 * 4. Stores in Document Vault (`saveToVault`).
 * 5. Creates `Document` vault record.
 * 6. Creates `Certificate` and `CourseCompletion` database records.
 */
export async function issueCourseCertificate(params: {
  enrollmentId: number
  courseId: number
  studentId: number
  studentName: string
  courseTitle: string
  instructorName?: string | null
  institutionName?: string | null
  finalScore?: number | null
  lessonsCompleted: number
  assignmentsCompleted: number
  quizzesPassed: number
  originUrl?: string
}) {
  const certificateId = generateCertificateId()
  const verificationToken = generateVerificationToken(certificateId, params.studentId, params.courseId)
  
  const baseUrl = params.originUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify/certificate/${certificateId}`

  // 1. Generate QR Code
  const { dataUrl: qrCodeDataUrl, pngBuffer: qrPngBuffer } = await generateCertificateQRCode(verificationUrl)

  // 2. Generate PDF Buffer
  const completionDate = new Date()
  const pdfBuffer = await generateCertificatePdf(
    {
      certificateId,
      studentName: params.studentName,
      courseTitle: params.courseTitle,
      instructorName: params.instructorName,
      institutionName: params.institutionName,
      completionDate,
      verificationUrl,
      finalScore: params.finalScore
    },
    qrPngBuffer
  )

  // 3. Save to Document Vault (Supabase storage or disk fallback)
  const fileName = `Certificate_${certificateId}.pdf`
  const vaultPath = await saveToVault(
    params.studentId,
    fileName,
    pdfBuffer,
    'application/pdf'
  )

  // Compute SHA-256 Hash for tamper verification
  const sha256Hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex')

  // 4. Create Document Vault entry in `documents`
  const document = await prisma.document.create({
    data: {
      studentId: params.studentId,
      fileName,
      filePath: vaultPath,
      fileType: 'application/pdf',
      fileSize: pdfBuffer.length,
      category: 'Certificates',
      documentType: 'CERTIFICATE',
      accessLevel: 'PRIVATE',
      verificationStatus: 'VERIFIED',
      processingStatus: 'COMPLETED',
      qualityScore: 100,
      verificationScore: 100,
      qrStatus: 'MATCH',
      sha256Hash,
      publicVerificationId: certificateId
    }
  })

  // 5. Create CourseCompletion Record
  const completion = await prisma.courseCompletion.upsert({
    where: { enrollmentId: params.enrollmentId },
    create: {
      enrollmentId: params.enrollmentId,
      courseId: params.courseId,
      studentId: params.studentId,
      completionPercentage: 100.0,
      finalScore: params.finalScore,
      lessonsCompleted: params.lessonsCompleted,
      assignmentsCompleted: params.assignmentsCompleted,
      quizzesPassed: params.quizzesPassed,
      completedAt: completionDate
    },
    update: {
      completionPercentage: 100.0,
      finalScore: params.finalScore,
      lessonsCompleted: params.lessonsCompleted,
      assignmentsCompleted: params.assignmentsCompleted,
      quizzesPassed: params.quizzesPassed,
      completedAt: completionDate
    }
  })

  // 6. Create Certificate Record
  const certificate = await prisma.certificate.create({
    data: {
      certificateId,
      verificationToken,
      enrollmentId: params.enrollmentId,
      courseId: params.courseId,
      studentId: params.studentId,
      documentId: document.id,
      studentName: params.studentName,
      courseTitle: params.courseTitle,
      instructorName: params.instructorName,
      institutionName: params.institutionName,
      issueDate: completionDate,
      status: 'valid',
      qrCodeDataUrl,
      pdfUrl: vaultPath
    }
  })

  // 7. Update CourseEnrollment status to completed
  await prisma.courseEnrollment.update({
    where: { id: params.enrollmentId },
    data: {
      status: 'completed',
      progressPercent: 100,
      completedAt: completionDate
    }
  })

  return {
    certificate,
    completion,
    document,
    pdfBuffer
  }
}
