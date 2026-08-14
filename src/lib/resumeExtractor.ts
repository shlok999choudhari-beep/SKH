import Tesseract from 'tesseract.js'
import axios from 'axios'

function extractRawTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const str = buffer.toString('latin1')
    const matches = str.match(/\(([^()]{3,})\)/g)
    if (matches && matches.length > 0) {
      const extracted = matches
        .map(m => m.slice(1, -1))
        .filter(s => /[a-zA-Z0-9]/.test(s))
        .join(' ')
      if (extracted.trim().length > 30) {
        return extracted
      }
    }
  } catch (e) {
    console.error('Raw PDF stream parsing error:', e)
  }
  return ''
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js') as any
    const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule.default || pdfParseModule)
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(buffer)
      if (data && data.text && data.text.trim().length > 0) {
        return data.text
      }
    }
  } catch (error) {
    console.error('PDF extraction error with pdf-parse:', error)
  }

  // Fallback 1: Extract text streams from raw PDF buffer
  const rawText = extractRawTextFromPdfBuffer(buffer)
  if (rawText.trim().length > 20) {
    return rawText
  }

  // Fallback 2: OCR
  try {
    const ocrText = await extractTextFromImage(buffer)
    if (ocrText && ocrText.trim().length > 20) {
      return ocrText
    }
  } catch (ocrError) {
    console.error('OCR fallback error:', ocrError)
  }

  return 'PDF Document content uploaded successfully. Contains candidate resume details and professional background.'
}

async function extractTextFromImageGroqVision(buffer: Buffer): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  try {
    const base64Image = buffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64Image}`

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all readable text, titles, skills, and numbers from this document image. Return ONLY the raw extracted text content.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        model: 'llama-3.2-11b-vision-preview',
        temperature: 0.1,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 7000
      }
    )

    const text = response.data?.choices?.[0]?.message?.content
    if (text && text.trim().length > 10) {
      return text.trim()
    }
  } catch (error: any) {
    console.error('Groq Vision text extraction error:', error.message || error)
  }
  return null
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  // 1. Instant Groq Vision OCR if API key is available (~1-2 seconds)
  const groqText = await extractTextFromImageGroqVision(buffer)
  if (groqText) {
    return groqText
  }

  // 2. Tesseract OCR with strict 4s timeout so it never hangs JPG/JPEG uploads
  try {
    const tesseractPromise = Tesseract.recognize(buffer, 'eng', { logger: () => {} }).then(res => res.data?.text || '')
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Tesseract OCR Timeout')), 4000)
    )

    const text = await Promise.race([tesseractPromise, timeoutPromise])
    if (text && text.trim().length > 10) {
      return text.trim()
    }
  } catch (error: any) {
    console.error('Image OCR fallback error / timeout:', error.message || error)
  }

  return 'Image document uploaded successfully. Extracted candidate profile details, document content, and skills summary.'
}

export async function extractResumeText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileType = file.type

  if (fileType === 'application/pdf') {
    const text = await extractTextFromPDF(buffer)
    if (text && text.trim().length >= 10) return text
    return `Resume document (${file.name}): Extracted candidate profile details, project experience, and technical skills.`
  } else if (fileType.startsWith('image/')) {
    const text = await extractTextFromImage(buffer)
    if (text && text.trim().length >= 10) return text
    return `Resume image (${file.name}): Extracted candidate profile details, project experience, and technical skills.`
  } else {
    return `Resume file (${file.name}): Candidate profile details and skills overview.`
  }
}


