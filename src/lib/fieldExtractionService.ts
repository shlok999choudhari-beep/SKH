import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = process.env.AI_MODEL || 'openai/gpt-oss-120b'

export interface ExtractedFieldItem {
  fieldName: string
  fieldValue: string | null
  confidence: number
  source: 'ocr' | 'groq' | 'heuristic' | 'qr'
}

export interface TypeSpecificFieldsResult {
  documentType: string
  fields: Record<string, string | null>
  fieldList: ExtractedFieldItem[]
  extractedSummary: string
}

/**
 * Heuristic regex extractor for specialized document types
 */
export function extractFieldsWithRegex(text: string, documentTypeHint?: string): Record<string, string | null> {
  const fields: Record<string, string | null> = {}
  const combined = text || ''
  const lines = combined.split('\n').map(l => l.trim()).filter(Boolean)

  // 1. Candidate / Student Name
  const nameMatch = combined.match(/(?:Student\s*Name|Candidate\s*Name|Name\s*(?:of\s*Student|of\s*Candidate)?|Name)[:\s]+([A-Za-z\s\.]{3,40})/i)
  if (nameMatch && !/(?:marksheet|certificate|university|college|semester)/i.test(nameMatch[1])) {
    fields.name = nameMatch[1].trim()
  } else {
    for (const line of lines.slice(0, 8)) {
      const clean = line.replace(/^[#\*\-•\s]+/, '').trim()
      if (clean.length >= 3 && clean.length <= 35 && /^[A-Z][a-zA-Z\.\s]{2,35}$/.test(clean)) {
        if (!/(?:resume|marksheet|certificate|curriculum|page|email|phone|university|department)/i.test(clean)) {
          fields.name = clean
          break
        }
      }
    }
  }

  // 2. Email & Phone
  const emailMatch = combined.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/)
  if (emailMatch) fields.email = emailMatch[0].trim()

  const phoneMatch = combined.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?91[-.\s]?[6-9]\d{9}/)
  if (phoneMatch) fields.phone = phoneMatch[0].trim()

  // 3. Roll Number / Student ID / Registration
  const rollMatch = combined.match(/(?:Roll\s*(?:No|Number|#)?|PRN|Student\s*ID)[:\s]+([A-Za-z0-9\-_/]{4,25})/i)
  if (rollMatch) {
    fields.rollNumber = rollMatch[1].trim()
    fields.studentId = rollMatch[1].trim()
  }

  const seatMatch = combined.match(/(?:Seat\s*(?:No|Number)|Hall\s*Ticket)[:\s]+([A-Za-z0-9\-_/]{4,25})/i)
  if (seatMatch) fields.seatNumber = seatMatch[1].trim()

  const regMatch = combined.match(/(?:Registration\s*(?:No|Number)|Enrollment\s*(?:No|Number))[:\s]+([A-Za-z0-9\-_/]{4,25})/i)
  if (regMatch) fields.registrationNumber = regMatch[1].trim()

  // 4. Certificate Number
  const certMatch = combined.match(/(?:Certificate\s*(?:No|Number|ID)|Doc\s*(?:No|Number)|Credential\s*ID)[:\s]+([A-Za-z0-9\-_/]{4,30})/i)
  if (certMatch) fields.certificateNumber = certMatch[1].trim()

  // 5. Institution & Organization
  const instMatch = combined.match(/(?:University|Institute|College|Academy|School)\s+(?:of\s+)?[A-Za-z\s&,\.]{3,60}/i)
  if (instMatch) fields.institution = instMatch[0].trim()

  const orgMatch = combined.match(/(?:Issued\s*by|Organization|Company|Issuer)[:\s]+([A-Za-z0-9\s&,\.]{3,50})/i)
  if (orgMatch) fields.organization = orgMatch[0].trim()

  // 6. Course & Department
  const courseMatch = combined.match(/(?:Course|Degree|Program|Branch|Discipline)[:\s]+([A-Za-z0-9\s&,\.]{3,50})/i)
  if (courseMatch) fields.course = courseMatch[1].trim()

  const deptMatch = combined.match(/(?:Department\s*of|Department)[:\s]+([A-Za-z0-9\s&,\.]{3,50})/i)
  if (deptMatch) fields.department = deptMatch[1].trim()

  // 7. CGPA / Grade / Percentage / Marks
  const cgpaMatch = combined.match(/(?:CGPA|SGPA|GPA)[:\s]+(\d+(?:\.\d+)?(?:\s*\/\s*10(?:\.0)?)?)/i)
  if (cgpaMatch) {
    fields.cgpa = cgpaMatch[1].trim()
    fields.grade = cgpaMatch[1].trim()
  }

  const percMatch = combined.match(/(?:Percentage|Marks\s*Percentage)[:\s]+(\d+(?:\.\d+)?\s*%)/i)
  if (percMatch) fields.percentage = percMatch[1].trim()

  const gradeMatch = combined.match(/(?:Grade|Overall\s*Grade)[:\s]+([A-O][\+\-]?|First\s*Class|Distinction|Pass)/i)
  if (gradeMatch) fields.grade = gradeMatch[1].trim()

  const totMarks = combined.match(/(?:Total\s*Marks|Grand\s*Total|Marks\s*Obtained)[:\s]+(\d+(?:\s*\/\s*\d+)?)/i)
  if (totMarks) fields.totalMarks = totMarks[1].trim()

  const resMatch = combined.match(/(?:Result|Status)[:\s]+(PASS|FAILED|FIRST\s*CLASS|DISTINCTION|COMPLETED|SUCCESSFUL)/i)
  if (resMatch) fields.result = resMatch[1].trim()

  // 8. Dates
  const dateMatches = combined.match(/\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi)
  if (dateMatches) {
    const uniqueDates = Array.from(new Set(dateMatches)).slice(0, 6)
    fields.dates = uniqueDates.join(', ')
    fields.issueDate = uniqueDates[uniqueDates.length - 1]
  }

  // 9. ID Specific: DOB
  const dobMatch = combined.match(/(?:DOB|Date\s*of\s*Birth)[:\s]+([0-9\/\-\.A-Za-z]{6,20})/i)
  if (dobMatch) fields.dateOfBirth = dobMatch[1].trim()

  return fields
}

/**
 * Groq AI semantic extraction assistance
 */
async function extractWithGroqSemanticAssist(
  ocrText: string,
  docType: string,
  regexFields: Record<string, string | null>
): Promise<Record<string, string | null>> {
  if (!GROQ_API_KEY || ocrText.length < 20) {
    return regexFields
  }

  try {
    const prompt = `You are an expert Document Intelligence extractor for college documents.
Analyze the following document text and extract all relevant fields in pure JSON format:

Document Type: ${docType}
Extracted Text:
"""
${ocrText.slice(0, 4000)}
"""

Return a JSON object with these keys (fill with null if not detected in text):
{
  "name": "string or null",
  "rollNumber": "string or null",
  "studentId": "string or null",
  "certificateNumber": "string or null",
  "institution": "string or null",
  "organization": "string or null",
  "course": "string or null",
  "department": "string or null",
  "issueDate": "string or null",
  "grade": "string or null",
  "cgpa": "string or null",
  "percentage": "string or null",
  "registrationNumber": "string or null",
  "seatNumber": "string or null",
  "totalMarks": "string or null",
  "result": "string or null",
  "dateOfBirth": "string or null"
}
Output ONLY valid JSON without markdown wrapping.`

    const response = await axios.post(
      GROQ_API_URL,
      {
        messages: [{ role: 'user', content: prompt }],
        model: GROQ_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    )

    const content = response.data?.choices?.[0]?.message?.content || '{}'
    const groqJson = JSON.parse(content)

    // Merge: prioritize regex/heuristic for high-precision matches, fill gaps with Groq
    const merged: Record<string, string | null> = { ...regexFields }
    for (const [k, v] of Object.entries(groqJson)) {
      if (v && typeof v === 'string' && v.trim().length > 0 && (!merged[k] || merged[k] === 'null')) {
        merged[k] = v.trim()
      }
    }
    return merged
  } catch (err: any) {
    console.warn('[FieldExtractionService] Groq semantic assist fallback:', err.message)
    return regexFields
  }
}

/**
 * Main Field Extraction Service
 * Combines high-speed deterministic regex rules with Groq AI semantic extraction
 */
export async function extractDocumentFields(
  ocrText: string,
  documentTypeHint?: string
): Promise<TypeSpecificFieldsResult> {
  const regexFields = extractFieldsWithRegex(ocrText, documentTypeHint)
  const inferredType = documentTypeHint || 'Other'
  const finalFields = await extractWithGroqSemanticAssist(ocrText, inferredType, regexFields)

  const fieldList: ExtractedFieldItem[] = Object.entries(finalFields)
    .filter(([_, v]) => v !== null && v !== undefined && String(v).trim().length > 0)
    .map(([k, v]) => ({
      fieldName: k,
      fieldValue: String(v),
      confidence: regexFields[k] ? 0.92 : 0.85,
      source: regexFields[k] ? 'heuristic' : 'groq'
    }))

  return {
    documentType: inferredType,
    fields: finalFields,
    fieldList,
    extractedSummary: `Extracted ${fieldList.length} structured fields for ${inferredType}.`
  }
}
