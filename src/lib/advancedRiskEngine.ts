export interface AdvancedRiskWeights {
  ocrWeight: number // default 0.15
  qualityWeight: number // default 0.10
  fieldWeight: number // default 0.20
  qrWeight: number // default 0.15
  duplicateWeight: number // default 0.10
  tamperWeight: number // default 0.15
  faceWeight: number // default 0.10
  aiWeight: number // default 0.05
}

export const DEFAULT_ADVANCED_WEIGHTS: AdvancedRiskWeights = {
  ocrWeight: 0.15,
  qualityWeight: 0.10,
  fieldWeight: 0.20,
  qrWeight: 0.15,
  duplicateWeight: 0.10,
  tamperWeight: 0.15,
  faceWeight: 0.10,
  aiWeight: 0.05
}

export interface RiskEvaluationInputs {
  ocrScore: number // 0 - 100
  qualityScore: number // 0 - 100
  fieldScore: number // 0 - 100
  qrScore: number // 0 - 100
  duplicateScore: number // 0 - 100 (100 = unique, 20 = duplicate)
  tamperScore: number // 0 - 100 (0 = clean, 100 = tampered)
  faceScore: number // 0 - 100
  aiScore: number // 0 - 100
  isExactDuplicate?: boolean
  hasHighSeverityTamper?: boolean
  hasQrMismatch?: boolean
  hasNameMismatch?: boolean
}

export interface RiskEvaluationResult {
  verificationScore: number
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  verificationStatus: 'VERIFIED' | 'UNDER_REVIEW' | 'SUSPICIOUS' | 'REJECTED'
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'REQUEST_REUPLOAD'
  passedChecks: string[]
  detectedIssues: string[]
  explanation: string
}

/**
 * 8-Factor Configurable Evidence-Based Risk Engine
 */
export function evaluateDocumentRisk(
  inputs: RiskEvaluationInputs,
  weights: AdvancedRiskWeights = DEFAULT_ADVANCED_WEIGHTS
): RiskEvaluationResult {
  const passedChecks: string[] = []
  const detectedIssues: string[] = []

  // Integrity is inverted tamper score (100 is clean, 0 is heavily tampered)
  const integrityScore = Math.max(0, 100 - inputs.tamperScore)

  // Weighted Score Calculation
  const totalScore = Math.round(
    inputs.ocrScore * weights.ocrWeight +
    inputs.qualityScore * weights.qualityWeight +
    inputs.fieldScore * weights.fieldWeight +
    inputs.qrScore * weights.qrWeight +
    inputs.duplicateScore * weights.duplicateWeight +
    integrityScore * weights.tamperWeight +
    inputs.faceScore * weights.faceWeight +
    inputs.aiScore * weights.aiWeight
  )

  const verificationScore = Math.min(100, Math.max(10, totalScore))
  const riskScore = Math.round(100 - verificationScore)

  // Classify Risk Level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
  if (riskScore > 40 || inputs.isExactDuplicate || inputs.hasHighSeverityTamper) {
    riskLevel = 'HIGH'
  } else if (riskScore > 20 || inputs.hasQrMismatch || inputs.hasNameMismatch) {
    riskLevel = 'MEDIUM'
  } else {
    riskLevel = 'LOW'
  }

  // Determine Verification Status & Recommendation
  let verificationStatus: 'VERIFIED' | 'UNDER_REVIEW' | 'SUSPICIOUS' | 'REJECTED' = 'UNDER_REVIEW'
  let recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'REQUEST_REUPLOAD' = 'APPROVE'

  if (inputs.isExactDuplicate) {
    verificationStatus = 'SUSPICIOUS'
    recommendation = 'MANUAL_REVIEW'
    detectedIssues.push('Identical duplicate document cryptographic hash already exists in database.')
  } else if (inputs.hasHighSeverityTamper) {
    verificationStatus = 'SUSPICIOUS'
    recommendation = 'MANUAL_REVIEW'
    detectedIssues.push('Forensic image analysis indicates potential digital tampering or editing.')
  } else if (verificationScore >= 80 && riskLevel === 'LOW') {
    verificationStatus = 'VERIFIED'
    recommendation = 'APPROVE'
    passedChecks.push('All 8 security, layout, OCR, and identity verification checks passed.')
  } else if (verificationScore >= 60) {
    verificationStatus = 'UNDER_REVIEW'
    recommendation = 'MANUAL_REVIEW'
  } else if (verificationScore >= 40) {
    verificationStatus = 'SUSPICIOUS'
    recommendation = 'MANUAL_REVIEW'
  } else {
    verificationStatus = 'REJECTED'
    recommendation = 'REJECT'
  }

  // Evidence Checklist Items
  if (inputs.ocrScore >= 80) passedChecks.push(`Smart OCR text recognized with ${inputs.ocrScore}% clarity.`)
  else detectedIssues.push(`Moderate OCR recognition confidence (${inputs.ocrScore}%).`)

  if (inputs.fieldScore >= 80) passedChecks.push('Candidate name and essential academic credentials verified.')
  else if (inputs.hasNameMismatch) detectedIssues.push('Candidate name discrepancy between document and student profile.')

  if (inputs.qrScore >= 80) passedChecks.push('QR / Barcode security payload matched with OCR text.')
  else if (inputs.hasQrMismatch) detectedIssues.push('QR security code payload does not match visible OCR text.')

  if (inputs.tamperScore <= 25) passedChecks.push('Document visual integrity verified clean (no ELA/edge anomalies).')
  else detectedIssues.push(`Visual integrity risk score is ${inputs.tamperScore}/100.`)

  if (inputs.faceScore >= 75) passedChecks.push(`Face matching verified against student profile photo (${inputs.faceScore}% match).`)

  const explanation = `Document processed with 8-Factor AI Forensic Engine. Verification Score: ${verificationScore}/100 (Risk: ${riskLevel}). Status: ${verificationStatus}.`

  return {
    verificationScore,
    riskScore,
    riskLevel,
    verificationStatus,
    recommendation,
    passedChecks,
    detectedIssues,
    explanation
  }
}
