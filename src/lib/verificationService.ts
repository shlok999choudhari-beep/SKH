import { prisma } from './prisma'
import { processDocumentStructure } from './documentProcessor'
import { performSmartOCR } from './ocrService'
import { analyzeQRAndBarcodes } from './qrBarcodeService'
import { detectDuplicates } from './duplicateDetectionService'
import { extractDocumentFields } from './fieldExtractionService'
import { detectDocumentRegions, saveYOLODetections } from './yoloRegionService'
import { analyzeDocumentIntegrity, saveTamperAnalysis } from './tamperDetectionService'
import { performFaceVerification, saveFaceVerification } from './faceVerificationService'
import { performAIReasoning } from './aiReasoningService'
import { evaluateDocumentRisk, DEFAULT_ADVANCED_WEIGHTS, AdvancedRiskWeights } from './advancedRiskEngine'

export interface StudentProfileContext {
  id?: number
  name?: string | null
  email?: string | null
  college?: string | null
  degree?: string | null
  cgpa?: number | null
}

export interface ComprehensiveVerificationResult {
  documentId: number
  documentType: string
  verificationStatus: 'VERIFIED' | 'UNDER_REVIEW' | 'SUSPICIOUS' | 'REJECTED'
  verificationScore: number
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'REQUEST_REUPLOAD'
  scores: {
    ocrScore: number
    qualityScore: number
    fieldScore: number
    qrScore: number
    duplicateScore: number
    tamperScore: number
    faceScore: number
    aiScore: number
  }
  reasons: string[]
  warnings: string[]
  explanation: string
  ocrConfidence: number
  isDuplicate: boolean
  qrStatus: string
  extractedFields: Record<string, string | null>
}

async function recordStage(
  documentId: number,
  stageName: string,
  status: 'COMPLETED' | 'SKIPPED' | 'FAILED' | 'WARNING',
  durationMs: number,
  details?: string
) {
  try {
    await prisma.verificationStage.create({
      data: {
        documentId,
        stageName,
        status,
        durationMs,
        details
      }
    })
  } catch {}
}

function normalizeStr(str?: string | null): string {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
}

function isNameConsistent(extractedName?: string | null, profileName?: string | null): boolean {
  if (!extractedName || !profileName) return true
  const n1 = normalizeStr(extractedName)
  const n2 = normalizeStr(profileName)
  if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true
  const parts1 = n1.split(' ').filter(p => p.length > 1)
  const parts2 = n2.split(' ').filter(p => p.length > 1)
  const common = parts1.filter(p => parts2.includes(p))
  return common.length >= Math.min(2, Math.min(parts1.length, parts2.length))
}

function isInstitutionConsistent(extractedInst?: string | null, profileCollege?: string | null): boolean {
  if (!extractedInst || !profileCollege) return true
  const inst = normalizeStr(extractedInst)
  const col = normalizeStr(profileCollege)
  return inst.includes(col) || col.includes(inst) || inst.split(' ').some(w => w.length > 4 && col.includes(w))
}

/**
 * Master Verification Pipeline Execution (Phase 1 + Phase 2)
 */
export async function executeDocumentVerificationPipeline(
  documentId: number,
  studentId: number,
  buffer: Buffer,
  fileName: string,
  fileType: string,
  category: string,
  documentTypeHint?: string,
  studentProfile?: StudentProfileContext,
  weights: AdvancedRiskWeights = DEFAULT_ADVANCED_WEIGHTS
): Promise<ComprehensiveVerificationResult> {
  const reasons: string[] = []
  const warnings: string[] = []
  const startPipelineTime = Date.now()

  // Stage 1: Document Upload & Processing Start
  await prisma.verificationStage.deleteMany({ where: { documentId } }).catch(() => {})
  await recordStage(documentId, 'DOCUMENT_UPLOADED', 'COMPLETED', 0, `Uploaded ${fileName} (${fileType})`)

  // Stage 2: Structure Parsing (Docling + PyMuPDF)
  const s2Start = Date.now()
  const docStructure = await processDocumentStructure(buffer, fileName, fileType, documentTypeHint)
  const effectiveDocType = docStructure.documentType || documentTypeHint || 'Other'
  await recordStage(documentId, 'PARSED', 'COMPLETED', Date.now() - s2Start, `Parsed ${docStructure.pages} pages with ${docStructure.sections.length} sections`)

  // Stage 3: Smart OCR
  const s3Start = Date.now()
  const ocrResult = await performSmartOCR(buffer, fileName, fileType)
  const combinedText = (ocrResult.fullText && ocrResult.fullText.length > 20)
    ? ocrResult.fullText
    : (docStructure.text || ocrResult.fullText || '')
  await recordStage(documentId, 'OCR_COMPLETED', 'COMPLETED', Date.now() - s3Start, `Recognized ${ocrResult.blocks.length} text blocks (${Math.round((ocrResult.meanConfidence || 0.85)*100)}% confidence)`)

  // Stage 4: Structured Field Extraction
  const s4Start = Date.now()
  const fieldExtraction = await extractDocumentFields(combinedText, effectiveDocType)
  const fields = fieldExtraction.fields

  // Dedicated Academic Marksheet Extraction for 10th / 12th
  if (category === 'Academic' || effectiveDocType.includes('Marksheet')) {
    try {
      const { extractAcademicMarksheet } = await import('./marksheetExtractionService')
      const levelHint = effectiveDocType === '12th Marksheet' ? 'TWELFTH' : 'TENTH'
      const academicData = await extractAcademicMarksheet(combinedText, ocrResult.blocks, levelHint)

      const existingMarksheet = await prisma.academicMarksheet.findFirst({
        where: { studentId, educationLevel: academicData.educationLevel }
      })

      const marksheetPayload = {
        documentId,
        board: academicData.board || null,
        studentName: academicData.studentName || null,
        rollNumber: academicData.rollNumber || null,
        registrationNumber: academicData.registrationNo || null,
        passingYear: academicData.passingYear || null,
        totalMarks: academicData.totalMarks || null,
        obtainedMarks: academicData.obtainedMarks || null,
        percentage: academicData.percentage || null,
        cgpa: academicData.cgpa || null,
        subjects: academicData.subjects.length > 0 ? JSON.stringify(academicData.subjects) : null,
        ocrConfidence: academicData.confidence,
        // OCR extraction parses candidate credentials; official verification occurs via DigiLocker in Phase 5 & 6
        verificationStatus: existingMarksheet?.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'
      }

      if (existingMarksheet) {
        await prisma.academicMarksheet.update({
          where: { id: existingMarksheet.id },
          data: marksheetPayload
        })
      } else {
        await prisma.academicMarksheet.create({
          data: {
            studentId,
            educationLevel: academicData.educationLevel,
            ...marksheetPayload
          }
        })
      }
    } catch (acadErr) {
      console.warn('[Verification] Academic marksheet auto-extraction warning:', acadErr)
    }
  }

  await recordStage(documentId, 'FIELDS_EXTRACTED', 'COMPLETED', Date.now() - s4Start, `Extracted ${fieldExtraction.fieldList.length} structured fields for ${effectiveDocType}`)

  // Stage 5: QR & Barcode Intelligence
  const s5Start = Date.now()
  const qrAnalysis = await analyzeQRAndBarcodes(buffer, fileName, fileType, combinedText)
  await recordStage(documentId, 'QR_CHECKED', 'COMPLETED', Date.now() - s5Start, `QR Status: ${qrAnalysis.qrStatus}`)

  // Stage 6: Duplicate Detection
  const s6Start = Date.now()
  const duplicateResult = await detectDuplicates(documentId, studentId, buffer, fileName, fileType)
  await recordStage(documentId, 'DUPLICATE_CHECKED', duplicateResult.isExactDuplicate ? 'WARNING' : 'COMPLETED', Date.now() - s6Start, duplicateResult.summary)

  // Stage 7: YOLO Document Region Detection
  const s7Start = Date.now()
  const yoloAnalysis = await detectDocumentRegions(buffer, fileName, fileType)
  await saveYOLODetections(documentId, yoloAnalysis.regions)
  await recordStage(documentId, 'YOLO_ANALYSIS', 'COMPLETED', Date.now() - s7Start, `Detected ${yoloAnalysis.regions.length} regions (Photo: ${yoloAnalysis.hasPhoto}, Sig: ${yoloAnalysis.hasSignature}, QR: ${yoloAnalysis.hasQRCode})`)

  // Stage 8: Advanced Tamper Analysis (ELA, Noise, Edges, PDF Forensics)
  const s8Start = Date.now()
  const tamperResult = await analyzeDocumentIntegrity(buffer, fileName, fileType)
  await saveTamperAnalysis(documentId, tamperResult)
  await recordStage(documentId, 'TAMPER_ANALYSIS', tamperResult.overallRiskLevel === 'HIGH' ? 'WARNING' : 'COMPLETED', Date.now() - s8Start, tamperResult.summary)

  // Stage 9: Optional DeepFace Facial Identity Verification
  const s9Start = Date.now()
  const faceResult = await performFaceVerification(
    documentId,
    studentId,
    buffer,
    null, // Profile photo buffer if stored
    yoloAnalysis.hasPhoto
  )
  await saveFaceVerification(documentId, studentId, faceResult)
  await recordStage(documentId, 'IDENTITY_VERIFICATION', faceResult.status === 'NO_MATCH' ? 'WARNING' : 'COMPLETED', Date.now() - s9Start, faceResult.details)

  // Stage 10: Multi-Provider AI Reasoning
  const s10Start = Date.now()
  const aiReasoning = await performAIReasoning(documentId, {
    documentType: effectiveDocType,
    fileName,
    extractedFields: fields,
    ocrTextSample: combinedText,
    studentProfile: studentProfile || undefined
  })
  await recordStage(documentId, 'AI_ANALYSIS', aiReasoning.riskLevel === 'HIGH' ? 'WARNING' : 'COMPLETED', Date.now() - s10Start, aiReasoning.reasoningSummary)

  // -------------------------------------------------------------
  // Stage 11: 8-Factor Evidence-Based Risk Evaluation
  // -------------------------------------------------------------
  const s11Start = Date.now()
  const ocrConfidence = Math.max(0.4, Math.min(1.0, ocrResult.meanConfidence || 0.85))
  const ocrScore = Math.round(ocrConfidence * 100)

  // Field Score
  let fieldPoints = 0
  let totalFieldChecks = 0
  const hasNameMis = studentProfile?.name && fields.name ? !isNameConsistent(fields.name, studentProfile.name) : false

  if (studentProfile?.name && fields.name) {
    totalFieldChecks++
    if (!hasNameMis) {
      fieldPoints++
      reasons.push(`Student name verified: "${fields.name}" matches profile`)
    } else {
      warnings.push(`Name discrepancy: Document shows "${fields.name}", profile is "${studentProfile.name}"`)
    }
  } else if (fields.name) {
    fieldPoints += 0.8
    totalFieldChecks++
  }

  if (studentProfile?.college && fields.institution) {
    totalFieldChecks++
    if (isInstitutionConsistent(fields.institution, studentProfile.college)) {
      fieldPoints++
      reasons.push(`Institution verified: "${fields.institution}" matches student college`)
    }
  }

  if (fields.certificateNumber || fields.rollNumber || fields.studentId || fields.seatNumber) {
    fieldPoints++
    totalFieldChecks++
  }
  const fieldScore = totalFieldChecks > 0 ? Math.round((fieldPoints / totalFieldChecks) * 100) : 85

  // Quality Score
  let qualityScore = 80
  if (combinedText.length > 100) qualityScore += 10
  if (docStructure.tables && docStructure.tables.length > 0) qualityScore += 10
  qualityScore = Math.min(100, Math.max(30, qualityScore))

  // QR Score
  let qrScore = 85
  if (qrAnalysis.hasQRCode || qrAnalysis.hasBarcode) {
    qrScore = (qrAnalysis.qrStatus === 'QR_VALID' || qrAnalysis.barcodeStatus === 'BARCODE_VALID') ? 100 : 40
  }

  // Duplicate Score
  const duplicateScore = duplicateResult.isExactDuplicate ? 20 : duplicateResult.isVisualDuplicate ? 40 : 100

  // Face Score
  const faceScore = Math.round(faceResult.similarityScore)

  // AI Consistency Score
  const aiScore = Math.round((aiReasoning.fieldConsistencyScore + aiReasoning.semanticConsistencyScore) / 2)

  // Evaluate final 8-factor risk
  const riskEvaluation = evaluateDocumentRisk(
    {
      ocrScore,
      qualityScore,
      fieldScore,
      qrScore,
      duplicateScore,
      tamperScore: tamperResult.tamperScore,
      faceScore,
      aiScore,
      isExactDuplicate: duplicateResult.isExactDuplicate,
      hasHighSeverityTamper: tamperResult.overallRiskLevel === 'HIGH',
      hasQrMismatch: qrAnalysis.qrStatus === 'QR_MISMATCH',
      hasNameMismatch: hasNameMis
    },
    weights
  )

  await recordStage(
    documentId,
    'RISK_SCORE_GENERATED',
    'COMPLETED',
    Date.now() - s11Start,
    `Verification Score: ${riskEvaluation.verificationScore}/100, Risk Level: ${riskEvaluation.riskLevel}`
  )

  await recordStage(
    documentId,
    'FINAL_DECISION',
    'COMPLETED',
    Date.now() - startPipelineTime,
    `Status: ${riskEvaluation.verificationStatus}, Recommendation: ${riskEvaluation.recommendation}`
  )

  // -------------------------------------------------------------
  // Persist Relational Records to Prisma
  // -------------------------------------------------------------
  try {
    // 1. Update Document Master Record
    await prisma.document.update({
      where: { id: documentId },
      data: {
        documentType: effectiveDocType,
        verificationStatus: riskEvaluation.verificationStatus,
        processingStatus: 'COMPLETED',
        qualityScore,
        verificationScore: riskEvaluation.verificationScore,
        riskScore: riskEvaluation.riskScore,
        tamperScore: tamperResult.tamperScore,
        faceMatchScore: faceResult.similarityScore,
        faceMatchStatus: faceResult.status,
        aiRiskLevel: riskEvaluation.riskLevel,
        ocrConfidence: ocrConfidence,
        sha256Hash: duplicateResult.hashes.sha256,
        perceptualHash: duplicateResult.hashes.dhash,
        qrStatus: qrAnalysis.qrStatus,
        qualityResult: JSON.stringify({
          qualityScore,
          scores: { ocrScore, fieldScore, qualityScore, qrScore, duplicateScore, tamperScore: tamperResult.tamperScore, faceScore, aiScore },
          reasons: [...reasons, ...riskEvaluation.passedChecks],
          warnings: [...warnings, ...riskEvaluation.detectedIssues],
          explanation: riskEvaluation.explanation
        }),
        extractedInformation: JSON.stringify(fields),
        verifiedAt: riskEvaluation.verificationStatus === 'VERIFIED' ? new Date() : null,
        rejectionReason: (riskEvaluation.verificationStatus === 'REJECTED' || riskEvaluation.verificationStatus === 'SUSPICIOUS')
          ? (riskEvaluation.detectedIssues[0] || riskEvaluation.explanation)
          : null
      }
    })

    // 2. OCR Result Record
    await prisma.oCRResult.upsert({
      where: { documentId },
      create: {
        documentId,
        fullText: combinedText,
        textBlocks: JSON.stringify(ocrResult.blocks),
        boundingBoxes: JSON.stringify(ocrResult.boundingBoxes),
        confidence: ocrConfidence,
        engine: ocrResult.engine,
        language: ocrResult.language,
        pageCount: docStructure.pages || 1
      },
      update: {
        fullText: combinedText,
        textBlocks: JSON.stringify(ocrResult.blocks),
        boundingBoxes: JSON.stringify(ocrResult.boundingBoxes),
        confidence: ocrConfidence,
        engine: ocrResult.engine,
        language: ocrResult.language,
        pageCount: docStructure.pages || 1
      }
    })

    // 3. Extracted Fields
    await prisma.extractedField.deleteMany({ where: { documentId } })
    if (fieldExtraction.fieldList.length > 0) {
      await prisma.extractedField.createMany({
        data: fieldExtraction.fieldList.map(f => ({
          documentId,
          fieldName: f.fieldName,
          fieldValue: f.fieldValue,
          confidence: f.confidence,
          source: f.source,
          isConsistent: f.fieldName === 'name' ? isNameConsistent(f.fieldValue, studentProfile?.name) : true
        }))
      })
    }

    // 4. Document Verification Master Breakdown
    await prisma.documentVerification.upsert({
      where: { documentId },
      create: {
        documentId,
        verificationScore: riskEvaluation.verificationScore,
        riskScore: riskEvaluation.riskScore,
        riskLevel: riskEvaluation.riskLevel,
        status: riskEvaluation.verificationStatus,
        ocrScore,
        fieldScore,
        qualityScore,
        qrScore,
        duplicateScore,
        tamperScore: tamperResult.tamperScore,
        faceScore,
        aiScore,
        reasons: JSON.stringify([...reasons, ...riskEvaluation.passedChecks]),
        warnings: JSON.stringify([...warnings, ...riskEvaluation.detectedIssues]),
        explanation: riskEvaluation.explanation
      },
      update: {
        verificationScore: riskEvaluation.verificationScore,
        riskScore: riskEvaluation.riskScore,
        riskLevel: riskEvaluation.riskLevel,
        status: riskEvaluation.verificationStatus,
        ocrScore,
        fieldScore,
        qualityScore,
        qrScore,
        duplicateScore,
        tamperScore: tamperResult.tamperScore,
        faceScore,
        aiScore,
        reasons: JSON.stringify([...reasons, ...riskEvaluation.passedChecks]),
        warnings: JSON.stringify([...warnings, ...riskEvaluation.detectedIssues]),
        explanation: riskEvaluation.explanation
      }
    })

    // 5. Verification History
    await prisma.verificationHistory.create({
      data: {
        documentId,
        newStatus: riskEvaluation.verificationStatus,
        score: riskEvaluation.verificationScore,
        reason: riskEvaluation.explanation
      }
    })

  } catch (dbErr: any) {
    console.error('[VerificationService] Database persistence error:', dbErr)
  }

  return {
    documentId,
    documentType: effectiveDocType,
    verificationStatus: riskEvaluation.verificationStatus,
    verificationScore: riskEvaluation.verificationScore,
    riskScore: riskEvaluation.riskScore,
    riskLevel: riskEvaluation.riskLevel,
    recommendation: riskEvaluation.recommendation,
    scores: {
      ocrScore,
      qualityScore,
      fieldScore,
      qrScore,
      duplicateScore,
      tamperScore: tamperResult.tamperScore,
      faceScore,
      aiScore
    },
    reasons: [...reasons, ...riskEvaluation.passedChecks],
    warnings: [...warnings, ...riskEvaluation.detectedIssues],
    explanation: riskEvaluation.explanation,
    ocrConfidence,
    isDuplicate: duplicateResult.isExactDuplicate || duplicateResult.isVisualDuplicate,
    qrStatus: qrAnalysis.qrStatus,
    extractedFields: fields
  }
}
