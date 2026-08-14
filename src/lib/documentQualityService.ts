import axios from 'axios'
import { extractTextFromPDF, extractTextFromImage } from './resumeExtractor'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface QualityAnalysisResult {
  documentDetected: boolean
  documentType: string // Marksheet, ID Card, Certificate, Resume, Transcript, Internship Certificate, Admission Document, Other
  qualityScore: number // 0-100
  status: 'READY' | 'NEEDS_REVIEW' | 'POOR_QUALITY' | 'UNRECOGNIZED'
  checks: {
    readable: boolean
    cropped: boolean
    blurry: boolean
    blank: boolean
    randomImage: boolean
    nameDetected: boolean
    institutionDetected: boolean
    documentNumberDetected: boolean
    rollNumberDetected: boolean
    dateDetected: boolean
    photoDetected: boolean
    qrDetected: boolean
    barcodeDetected: boolean
  }
  extractedInformation: {
    name: string | null
    institution: string | null
    documentNumber: string | null
    rollNumber: string | null
    registrationNumber: string | null
    yearOrDate: string | null
    certificateNumber: string | null
  }
  warnings: string[]
  passedChecks: string[]
  message: string
}

export async function extractTextFromBuffer(buffer: Buffer, fileType: string): Promise<string> {
  try {
    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(buffer)
    } else if (fileType.startsWith('image/')) {
      return await extractTextFromImage(buffer)
    } else {
      return ''
    }
  } catch (error) {
    console.error('Extraction error:', error)
    return ''
  }
}

export async function analyzeDocumentQuality(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<QualityAnalysisResult> {
  const textContent = await extractTextFromBuffer(buffer, fileType)
  const trimmedText = textContent.trim()

  // Default fallback if Groq or extraction encounters issues
  let fallbackResult: QualityAnalysisResult = {
    documentDetected: trimmedText.length > 20,
    documentType: 'Other',
    qualityScore: trimmedText.length > 100 ? 75 : 45,
    status: trimmedText.length > 100 ? 'READY' : 'NEEDS_REVIEW',
    checks: {
      readable: trimmedText.length > 20,
      cropped: false,
      blurry: trimmedText.length < 20,
      blank: trimmedText.length === 0,
      randomImage: false,
      nameDetected: false,
      institutionDetected: false,
      documentNumberDetected: false,
      rollNumberDetected: false,
      dateDetected: false,
      photoDetected: false,
      qrDetected: false,
      barcodeDetected: false
    },
    extractedInformation: {
      name: null,
      institution: null,
      documentNumber: null,
      rollNumber: null,
      registrationNumber: null,
      yearOrDate: null,
      certificateNumber: null
    },
    warnings: trimmedText.length < 20 ? ['Low readable text detected in file.'] : [],
    passedChecks: trimmedText.length > 20 ? ['Text content extracted successfully'] : [],
    message: trimmedText.length > 50 ? 'Document appears suitable for upload.' : 'Document needs manual review.'
  }

  if (!GROQ_API_KEY) {
    return fallbackResult
  }

  try {
    const prompt = `Analyze this document content for quality, document type classification, visual/structure integrity, and field extraction.
    
File Name: ${fileName}
File Type: ${fileType}
Extracted Text Content (first 3000 chars):
${trimmedText.slice(0, 3000) || '[No text extracted or raw visual document]'}

Perform a document suitability analysis. Respond strictly with pure valid JSON matching this schema (do NOT include markdown codeblocks or any prose):

{
  "documentDetected": true/false,
  "documentType": "Marksheet" | "ID Card" | "Certificate" | "Resume" | "Transcript" | "Internship Certificate" | "Admission Document" | "Other",
  "qualityScore": number (0 to 100),
  "status": "READY" | "NEEDS_REVIEW" | "POOR_QUALITY" | "UNRECOGNIZED",
  "checks": {
    "readable": true/false,
    "cropped": true/false,
    "blurry": true/false,
    "blank": true/false,
    "randomImage": true/false,
    "nameDetected": true/false,
    "institutionDetected": true/false,
    "documentNumberDetected": true/false,
    "rollNumberDetected": true/false,
    "dateDetected": true/false,
    "photoDetected": true/false,
    "qrDetected": true/false,
    "barcodeDetected": true/false
  },
  "extractedInformation": {
    "name": string or null,
    "institution": string or null,
    "documentNumber": string or null,
    "rollNumber": string or null,
    "registrationNumber": string or null,
    "yearOrDate": string or null,
    "certificateNumber": string or null
  },
  "warnings": [string],
  "passedChecks": [string],
  "message": "User-facing summary message (e.g. Document appears suitable for upload.)"
}`

    const response = await axios.post(
      GROQ_API_URL,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an AI document quality analyzer. You evaluate uploaded academic, professional, and identity documents for quality, structure, readability, and key field presence. Never claim legal or government authenticity. Respond in pure JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
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
      documentDetected: Boolean(parsed.documentDetected),
      documentType: parsed.documentType || 'Other',
      qualityScore: typeof parsed.qualityScore === 'number' ? parsed.qualityScore : 70,
      status: parsed.status || 'READY',
      checks: {
        readable: Boolean(parsed.checks?.readable),
        cropped: Boolean(parsed.checks?.cropped),
        blurry: Boolean(parsed.checks?.blurry),
        blank: Boolean(parsed.checks?.blank),
        randomImage: Boolean(parsed.checks?.randomImage),
        nameDetected: Boolean(parsed.checks?.nameDetected),
        institutionDetected: Boolean(parsed.checks?.institutionDetected),
        documentNumberDetected: Boolean(parsed.checks?.documentNumberDetected),
        rollNumberDetected: Boolean(parsed.checks?.rollNumberDetected),
        dateDetected: Boolean(parsed.checks?.dateDetected),
        photoDetected: Boolean(parsed.checks?.photoDetected),
        qrDetected: Boolean(parsed.checks?.qrDetected),
        barcodeDetected: Boolean(parsed.checks?.barcodeDetected)
      },
      extractedInformation: {
        name: parsed.extractedInformation?.name || null,
        institution: parsed.extractedInformation?.institution || null,
        documentNumber: parsed.extractedInformation?.documentNumber || null,
        rollNumber: parsed.extractedInformation?.rollNumber || null,
        registrationNumber: parsed.extractedInformation?.registrationNumber || null,
        yearOrDate: parsed.extractedInformation?.yearOrDate || null,
        certificateNumber: parsed.extractedInformation?.certificateNumber || null
      },
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      passedChecks: Array.isArray(parsed.passedChecks) ? parsed.passedChecks : [],
      message: parsed.message || 'Document quality check complete.'
    }
  } catch (error) {
    console.error('Groq AI Document Quality Check error:', error)
    return fallbackResult
  }
}
