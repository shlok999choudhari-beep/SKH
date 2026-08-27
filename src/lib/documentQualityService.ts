import axios from 'axios'
import { extractWithDocling, DoclingExtractionResult, DoclingSection, DoclingTable } from './doclingService'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface DocumentVerificationReport {
  success: boolean
  documentDetected: boolean
  documentType: string
  qualityScore: number // 0-100
  verificationStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' | 'FAILED'
  pages: number
  checks: {
    readable: boolean
    structureValid: boolean
    tablesDetected: boolean
    nameDetected: boolean
    nameMatchesStudent: boolean
    institutionDetected: boolean
    documentNumberDetected: boolean
    dateDetected: boolean
    noSuspiciousArtifacts: boolean
  }
  extractedInformation: {
    name: string | null
    studentId: string | null
    rollNumber: string | null
    institution: string | null
    documentType: string | null
    dates: string[] | null
    cgpaOrGrade: string | null
    certificateNumber: string | null
  }
  doclingData: {
    markdown: string
    sections: DoclingSection[]
    tables: DoclingTable[]
    metadata: Record<string, unknown>
  }
  warnings: string[]
  passedChecks: string[]
  explanation: string
}

/**
 * Deterministic helper to evaluate string similarity (e.g. Student name check)
 */
function isNameSimilar(extractedName: string | null, studentName?: string | null): boolean {
  if (!extractedName || !studentName) return true
  const cleanExtracted = extractedName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()
  const cleanStudent = studentName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()

  const extractedTokens = cleanExtracted.split(/\s+/).filter(t => t.length > 2)
  const studentTokens = cleanStudent.split(/\s+/).filter(t => t.length > 2)

  if (extractedTokens.length === 0 || studentTokens.length === 0) return true

  // Check if at least one significant token matches (first name or last name)
  return studentTokens.some(t => extractedTokens.includes(t)) || extractedTokens.some(t => studentTokens.includes(t))
}

/**
 * Full Pipeline: Docling Document Extraction -> Deterministic Checks -> Groq AI Semantic Verification
 */
export async function processAndVerifyDocument(
  buffer: Buffer,
  fileName: string,
  fileType: string,
  studentProfile?: {
    name?: string | null
    email?: string | null
    college?: string | null
  }
): Promise<DocumentVerificationReport> {
  // Step 1: Docling Extraction
  const doclingResult: DoclingExtractionResult = await extractWithDocling(
    buffer,
    fileName,
    fileType
  )

  const extractedText = doclingResult.text.trim()
  const doclingFields = doclingResult.fields || {}
  const tablesCount = doclingResult.tables ? doclingResult.tables.length : 0
  const sectionsCount = doclingResult.sections ? doclingResult.sections.length : 0

  // Step 2: Initial Deterministic Checks
  const isReadable = extractedText.length > 20
  const hasStructure = sectionsCount > 0 || doclingResult.markdown.length > 50
  const hasTables = tablesCount > 0

  // Name check
  const candidateName = doclingFields.name || null
  const nameMatches = candidateName ? isNameSimilar(candidateName, studentProfile?.name) : true

  const defaultReport: DocumentVerificationReport = {
    success: doclingResult.success,
    documentDetected: isReadable,
    documentType: doclingResult.documentType || 'Other',
    qualityScore: isReadable ? (hasStructure ? 80 : 65) : 30,
    verificationStatus: isReadable ? (hasStructure && nameMatches ? 'VERIFIED' : 'NEEDS_REVIEW') : 'FAILED',
    pages: doclingResult.pages || 1,
    checks: {
      readable: isReadable,
      structureValid: hasStructure,
      tablesDetected: hasTables,
      nameDetected: Boolean(candidateName),
      nameMatchesStudent: nameMatches,
      institutionDetected: Boolean(doclingFields.institution),
      documentNumberDetected: Boolean(doclingFields.rollNumber || doclingFields.certificateNumber),
      dateDetected: Boolean(doclingFields.dates && doclingFields.dates.length > 0),
      noSuspiciousArtifacts: true
    },
    extractedInformation: {
      name: candidateName,
      studentId: doclingFields.studentId || null,
      rollNumber: doclingFields.rollNumber || null,
      institution: doclingFields.institution || studentProfile?.college || null,
      documentType: doclingResult.documentType || 'Other',
      dates: doclingFields.dates || null,
      cgpaOrGrade: doclingFields.cgpaOrGrade || null,
      certificateNumber: doclingFields.certificateNumber || null
    },
    doclingData: {
      markdown: doclingResult.markdown || extractedText,
      sections: doclingResult.sections || [],
      tables: doclingResult.tables || [],
      metadata: doclingResult.metadata || {}
    },
    warnings: !isReadable ? ['Very low text extracted from document.'] : [],
    passedChecks: isReadable ? ['Docling structural extraction successful'] : [],
    explanation: isReadable
      ? 'Document layout and text parsed successfully with Docling.'
      : 'Document appears blurry, blank, or unreadable.'
  }

  // Step 3: Groq AI Semantic Verification if GROQ_API_KEY is available
  if (!GROQ_API_KEY || !isReadable) {
    return defaultReport
  }

  try {
    const prompt = `You are the verification engine for PlaceIQ document vault.
You are evaluating a document extracted using Docling.

File Name: ${fileName}
File Type: ${fileType}
Registered Student Name: ${studentProfile?.name || 'Unknown'}
Registered College: ${studentProfile?.college || 'Unknown'}
Docling Detected Document Type: ${doclingResult.documentType}
Pages: ${doclingResult.pages}
Tables Detected: ${tablesCount}
Sections Detected: ${sectionsCount}

Docling Structured Markdown Content (first 4000 chars):
${doclingResult.markdown.slice(0, 4000) || extractedText.slice(0, 4000)}

Perform semantic verification of this document. Check:
1. Document authenticity, consistency, and completeness.
2. Verify if candidate name or identifiers in document match or conflict with the student profile.
3. Validate presence of expected fields (dates, institutions, roll numbers, grades).
4. Assign a verificationStatus: "VERIFIED" (clean, high confidence), "NEEDS_REVIEW" (minor ambiguity/missing field), or "REJECTED" (clear mismatch, fake or invalid document).
5. Assign a confidence qualityScore (0 to 100).
6. Provide a concise, professional explanation for the student and institution.

Respond STRICTLY with valid JSON matching this schema (do NOT include markdown code blocks or additional text):

{
  "documentDetected": true,
  "documentType": "Marksheet" | "ID Card" | "Certificate" | "Resume" | "Transcript" | "Internship Certificate" | "Degree Certificate" | "Admission Document" | "Other",
  "qualityScore": number (0 to 100),
  "verificationStatus": "VERIFIED" | "NEEDS_REVIEW" | "REJECTED",
  "checks": {
    "readable": true,
    "structureValid": true,
    "tablesDetected": true/false,
    "nameDetected": true/false,
    "nameMatchesStudent": true/false,
    "institutionDetected": true/false,
    "documentNumberDetected": true/false,
    "dateDetected": true/false,
    "noSuspiciousArtifacts": true/false
  },
  "extractedInformation": {
    "name": string or null,
    "studentId": string or null,
    "rollNumber": string or null,
    "institution": string or null,
    "documentType": string or null,
    "dates": [string] or null,
    "cgpaOrGrade": string or null,
    "certificateNumber": string or null
  },
  "warnings": [string],
  "passedChecks": [string],
  "explanation": "Clear summary of verification results"
}`

    const response = await axios.post(
      GROQ_API_URL,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an enterprise document verification system. You analyze Docling structured document extractions for authenticity, layout integrity, and entity validation. Respond strictly in pure JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'openai/gpt-oss-120b',
        temperature: 0.1,
        max_tokens: 1800
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    )

    const content = response.data.choices[0].message.content
    let jsonStr = content
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())

    return {
      success: true,
      documentDetected: Boolean(parsed.documentDetected),
      documentType: parsed.documentType || doclingResult.documentType || 'Other',
      qualityScore: typeof parsed.qualityScore === 'number' ? Math.min(100, Math.max(0, parsed.qualityScore)) : defaultReport.qualityScore,
      verificationStatus: ['VERIFIED', 'NEEDS_REVIEW', 'REJECTED'].includes(parsed.verificationStatus) ? parsed.verificationStatus : defaultReport.verificationStatus,
      pages: doclingResult.pages || 1,
      checks: {
        readable: Boolean(parsed.checks?.readable ?? defaultReport.checks.readable),
        structureValid: Boolean(parsed.checks?.structureValid ?? defaultReport.checks.structureValid),
        tablesDetected: Boolean(parsed.checks?.tablesDetected ?? defaultReport.checks.tablesDetected),
        nameDetected: Boolean(parsed.checks?.nameDetected ?? defaultReport.checks.nameDetected),
        nameMatchesStudent: Boolean(parsed.checks?.nameMatchesStudent ?? defaultReport.checks.nameMatchesStudent),
        institutionDetected: Boolean(parsed.checks?.institutionDetected ?? defaultReport.checks.institutionDetected),
        documentNumberDetected: Boolean(parsed.checks?.documentNumberDetected ?? defaultReport.checks.documentNumberDetected),
        dateDetected: Boolean(parsed.checks?.dateDetected ?? defaultReport.checks.dateDetected),
        noSuspiciousArtifacts: Boolean(parsed.checks?.noSuspiciousArtifacts ?? defaultReport.checks.noSuspiciousArtifacts)
      },
      extractedInformation: {
        name: parsed.extractedInformation?.name || defaultReport.extractedInformation.name,
        studentId: parsed.extractedInformation?.studentId || defaultReport.extractedInformation.studentId,
        rollNumber: parsed.extractedInformation?.rollNumber || defaultReport.extractedInformation.rollNumber,
        institution: parsed.extractedInformation?.institution || defaultReport.extractedInformation.institution,
        documentType: parsed.extractedInformation?.documentType || defaultReport.extractedInformation.documentType,
        dates: parsed.extractedInformation?.dates || defaultReport.extractedInformation.dates,
        cgpaOrGrade: parsed.extractedInformation?.cgpaOrGrade || defaultReport.extractedInformation.cgpaOrGrade,
        certificateNumber: parsed.extractedInformation?.certificateNumber || defaultReport.extractedInformation.certificateNumber
      },
      doclingData: defaultReport.doclingData,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : defaultReport.warnings,
      passedChecks: Array.isArray(parsed.passedChecks) ? parsed.passedChecks : defaultReport.passedChecks,
      explanation: parsed.explanation || defaultReport.explanation
    }
  } catch (groqError) {
    console.error('Groq AI Document Verification error:', groqError)
    return defaultReport
  }
}

/**
 * Backward-compatible wrapper for lightweight pre-upload checks
 */
export async function analyzeDocumentQuality(
  buffer: Buffer,
  fileName: string,
  fileType: string
) {
  const report = await processAndVerifyDocument(buffer, fileName, fileType)
  return {
    documentDetected: report.documentDetected,
    documentType: report.documentType,
    qualityScore: report.qualityScore,
    status: report.verificationStatus === 'VERIFIED' ? 'READY' : report.verificationStatus === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'POOR_QUALITY',
    checks: {
      readable: report.checks.readable,
      cropped: false,
      blurry: !report.checks.readable,
      blank: !report.checks.readable,
      randomImage: false,
      nameDetected: report.checks.nameDetected,
      institutionDetected: report.checks.institutionDetected,
      documentNumberDetected: report.checks.documentNumberDetected,
      rollNumberDetected: report.checks.documentNumberDetected,
      dateDetected: report.checks.dateDetected,
      photoDetected: false,
      qrDetected: false,
      barcodeDetected: false
    },
    extractedInformation: {
      name: report.extractedInformation.name,
      institution: report.extractedInformation.institution,
      documentNumber: report.extractedInformation.certificateNumber || report.extractedInformation.rollNumber,
      rollNumber: report.extractedInformation.rollNumber,
      registrationNumber: report.extractedInformation.studentId,
      yearOrDate: report.extractedInformation.dates ? report.extractedInformation.dates[0] : null,
      certificateNumber: report.extractedInformation.certificateNumber
    },
    warnings: report.warnings,
    passedChecks: report.passedChecks,
    message: report.explanation,
    doclingData: report.doclingData
  }
}
