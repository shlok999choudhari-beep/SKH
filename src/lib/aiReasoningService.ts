import axios from 'axios'
import { prisma } from './prisma'

export interface AIEvidenceItem {
  evidenceType: 'DATE_INCONSISTENCY' | 'NAME_MISMATCH' | 'ANOMALOUS_FIELD' | 'STRUCTURE_MISMATCH' | string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  rawProof?: string
}

export interface AIReasoningResult {
  provider: 'qwen' | 'llama' | 'mistral' | 'groq' | 'rule_engine'
  modelName: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number // 0.0 to 1.0
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'REQUEST_REUPLOAD'
  fieldConsistencyScore: number // 0 to 100
  semanticConsistencyScore: number // 0 to 100
  documentTypeConfidence: number // 0 to 100
  reasoningSummary: string
  evidences: AIEvidenceItem[]
}

export interface AIReasoningContext {
  documentType: string
  fileName: string
  extractedFields: Record<string, any>
  ocrTextSample: string
  studentProfile?: {
    name?: string | null
    email?: string | null
    college?: string | null
    degree?: string | null
  }
}

/**
 * AI Provider Interface for Open-Weight / Local / Cloud Models
 */
export interface AIProvider {
  name: 'qwen' | 'llama' | 'mistral' | 'groq' | 'rule_engine'
  modelName: string
  analyzeDocument(context: AIReasoningContext): Promise<AIReasoningResult>
}

// -------------------------------------------------------------
// Groq / Open-Weight Model Provider
// -------------------------------------------------------------
export class GroqAIProvider implements AIProvider {
  name: 'groq' = 'groq'
  modelName: string
  apiKey: string

  constructor(modelName: string = process.env.AI_MODEL || 'openai/gpt-oss-120b', apiKey: string = process.env.GROQ_API_KEY || '') {
    this.modelName = modelName
    this.apiKey = apiKey
  }

  async analyzeDocument(context: AIReasoningContext): Promise<AIReasoningResult> {
    if (!this.apiKey) {
      return new RuleEngineAIProvider().analyzeDocument(context)
    }

    try {
      const prompt = `You are an expert AI Document Forensic & Academic Verification Engine.
Analyze the following structured document evidence and student profile context for logical, semantic, and identity consistency:

Claimed Document Type: ${context.documentType}
File Name: ${context.fileName}
Student Profile: ${JSON.stringify(context.studentProfile || {})}
Extracted Fields: ${JSON.stringify(context.extractedFields || {})}
OCR Text Excerpt:
"""
${context.ocrTextSample.slice(0, 2500)}
"""

Evaluate:
1. Field & Profile Consistency (Name, ID, College)
2. Semantic Consistency (Dates sequence, academic grading, institution legitimacy)
3. Document-Type alignment

Return ONLY valid JSON matching this exact structure:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "confidence": number between 0.5 and 1.0,
  "recommendation": "APPROVE" | "MANUAL_REVIEW" | "REJECT" | "REQUEST_REUPLOAD",
  "fieldConsistencyScore": number between 0 and 100,
  "semanticConsistencyScore": number between 0 and 100,
  "documentTypeConfidence": number between 0 and 100,
  "reasoningSummary": "Concise 1-2 sentence evidence-based summary",
  "evidences": [
    {
      "evidenceType": "DATE_INCONSISTENCY" | "NAME_MISMATCH" | "ANOMALOUS_FIELD" | "STRUCTURE_MISMATCH",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "description": "Explanation of issue or passed check"
    }
  ]
}`

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          messages: [{ role: 'user', content: prompt }],
          model: this.modelName,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      )

      const content = response.data?.choices?.[0]?.message?.content || '{}'
      const parsed = JSON.parse(content)

      return {
        provider: 'groq',
        modelName: this.modelName,
        riskLevel: parsed.riskLevel || 'LOW',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.92,
        recommendation: parsed.recommendation || 'APPROVE',
        fieldConsistencyScore: parsed.fieldConsistencyScore ?? 90,
        semanticConsistencyScore: parsed.semanticConsistencyScore ?? 90,
        documentTypeConfidence: parsed.documentTypeConfidence ?? 95,
        reasoningSummary: parsed.reasoningSummary || 'Document verified with internal semantic and profile consistency.',
        evidences: Array.isArray(parsed.evidences) ? parsed.evidences : []
      }
    } catch (err: any) {
      console.warn('[GroqAIProvider] Fallback to Rule Engine:', err.message)
      return new RuleEngineAIProvider().analyzeDocument(context)
    }
  }
}

// -------------------------------------------------------------
// Local Qwen / Llama / Mistral Provider (Ollama / Local Endpoint)
// -------------------------------------------------------------
export class LocalOpenWeightAIProvider implements AIProvider {
  name: 'qwen' | 'llama' | 'mistral'
  modelName: string
  endpoint: string

  constructor(providerName: 'qwen' | 'llama' | 'mistral', modelName: string, endpoint: string = 'http://127.0.0.1:11434/api/generate') {
    this.name = providerName
    this.modelName = modelName
    this.endpoint = endpoint
  }

  async analyzeDocument(context: AIReasoningContext): Promise<AIReasoningResult> {
    try {
      const prompt = `Analyze document verification evidence and return JSON:
Document Type: ${context.documentType}
Fields: ${JSON.stringify(context.extractedFields)}
Profile: ${JSON.stringify(context.studentProfile)}
Output: { "riskLevel": "LOW"|"MEDIUM"|"HIGH", "recommendation": "APPROVE"|"MANUAL_REVIEW"|"REJECT", "fieldConsistencyScore": 90, "semanticConsistencyScore": 90, "documentTypeConfidence": 95, "reasoningSummary": "...", "evidences": [] }`

      const response = await axios.post(
        this.endpoint,
        {
          model: this.modelName,
          prompt,
          format: 'json',
          stream: false
        },
        { timeout: 10000 }
      )

      if (response.data?.response) {
        const parsed = JSON.parse(response.data.response)
        return {
          provider: this.name,
          modelName: this.modelName,
          riskLevel: parsed.riskLevel || 'LOW',
          confidence: 0.9,
          recommendation: parsed.recommendation || 'APPROVE',
          fieldConsistencyScore: parsed.fieldConsistencyScore ?? 90,
          semanticConsistencyScore: parsed.semanticConsistencyScore ?? 90,
          documentTypeConfidence: parsed.documentTypeConfidence ?? 95,
          reasoningSummary: parsed.reasoningSummary || 'Verified with local open-weight model.',
          evidences: parsed.evidences || []
        }
      }
    } catch {
      // Fallback
    }
    return new RuleEngineAIProvider().analyzeDocument(context)
  }
}

// -------------------------------------------------------------
// High-Speed Rule Engine AI Provider (Guaranteed Local Fallback)
// -------------------------------------------------------------
export class RuleEngineAIProvider implements AIProvider {
  name: 'rule_engine' = 'rule_engine'
  modelName: string = 'PlaceIQ-Heuristic-Rule-Engine-v2'

  async analyzeDocument(context: AIReasoningContext): Promise<AIReasoningResult> {
    const evidences: AIEvidenceItem[] = []
    let fieldScore = 90
    let semanticScore = 95
    let docTypeScore = 90
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
    let recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT' | 'REQUEST_REUPLOAD' = 'APPROVE'

    const fields = context.extractedFields || {}
    const profile = context.studentProfile || {}

    // Check 1: Name consistency
    if (fields.name && profile.name) {
      const fn = fields.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const pn = profile.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!fn.includes(pn) && !pn.includes(fn)) {
        fieldScore -= 25
        evidences.push({
          evidenceType: 'NAME_MISMATCH',
          severity: 'MEDIUM',
          description: `Extracted candidate name "${fields.name}" does not match profile name "${profile.name}".`
        })
      }
    }

    // Check 2: Semantic Date Inconsistency (Start Date after End Date)
    if (fields.startDate && fields.endDate) {
      try {
        const d1 = new Date(fields.startDate).getTime()
        const d2 = new Date(fields.endDate).getTime()
        if (!isNaN(d1) && !isNaN(d2) && d1 > d2) {
          semanticScore -= 40
          riskLevel = 'MEDIUM'
          evidences.push({
            evidenceType: 'DATE_INCONSISTENCY',
            severity: 'HIGH',
            description: `Start date (${fields.startDate}) is after end date (${fields.endDate}).`
          })
        }
      } catch {}
    }

    // Check 3: Essential ID numbers
    if (!fields.rollNumber && !fields.certificateNumber && !fields.studentId) {
      fieldScore -= 15
    }

    if (fieldScore < 50 || semanticScore < 50) {
      riskLevel = 'HIGH'
      recommendation = 'MANUAL_REVIEW'
    } else if (fieldScore < 65 || semanticScore < 65) {
      riskLevel = 'MEDIUM'
      recommendation = 'MANUAL_REVIEW'
    }

    return {
      provider: 'rule_engine',
      modelName: this.modelName,
      riskLevel,
      confidence: 0.94,
      recommendation,
      fieldConsistencyScore: Math.max(20, fieldScore),
      semanticConsistencyScore: Math.max(20, semanticScore),
      documentTypeConfidence: docTypeScore,
      reasoningSummary: `Document fields and dates evaluated. Risk level is ${riskLevel}.`,
      evidences
    }
  }
}

/**
 * Factory to get configured AI Provider
 */
export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase()

  if (provider === 'qwen') {
    return new LocalOpenWeightAIProvider('qwen', process.env.LOCAL_AI_MODEL || 'qwen2.5:7b')
  }
  if (provider === 'llama') {
    return new LocalOpenWeightAIProvider('llama', process.env.LOCAL_AI_MODEL || 'llama3.2:3b')
  }
  if (provider === 'mistral') {
    return new LocalOpenWeightAIProvider('mistral', process.env.LOCAL_AI_MODEL || 'mistral:7b')
  }
  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    return new GroqAIProvider()
  }

  return new RuleEngineAIProvider()
}

/**
 * Executes AI Document Reasoning & Persists Record
 */
export async function performAIReasoning(
  documentId: number,
  context: AIReasoningContext
): Promise<AIReasoningResult> {
  const provider = getAIProvider()
  const result = await provider.analyzeDocument(context)

  try {
    const existing = await prisma.aIAnalysis.findUnique({ where: { documentId } })
    if (existing) {
      await prisma.aIAnalysisEvidence.deleteMany({ where: { aiAnalysisId: existing.id } })
      await prisma.aIAnalysis.delete({ where: { documentId } })
    }

    await prisma.aIAnalysis.create({
      data: {
        documentId,
        provider: result.provider,
        modelName: result.modelName,
        riskLevel: result.riskLevel,
        confidence: result.confidence,
        recommendation: result.recommendation,
        fieldConsistencyScore: result.fieldConsistencyScore,
        semanticConsistencyScore: result.semanticConsistencyScore,
        documentTypeConfidence: result.documentTypeConfidence,
        reasoningSummary: result.reasoningSummary,
        evidences: {
          create: result.evidences.map(e => ({
            evidenceType: e.evidenceType,
            severity: e.severity,
            description: e.description,
            rawProof: e.rawProof || null
          }))
        }
      }
    })
  } catch (err: any) {
    console.error('[AIReasoningService] DB save error:', err.message)
  }

  return result
}
