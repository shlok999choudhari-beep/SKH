import Tesseract from 'tesseract.js'

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Use dynamic import for pdf-parse with type assertion
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js') as any
    const data = await pdfParse.default(buffer)
    return data.text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: () => {}
    })
    return text
  } catch (error) {
    console.error('Image OCR error:', error)
    throw new Error('Failed to extract text from image')
  }
}

export async function extractResumeText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileType = file.type

  if (fileType === 'application/pdf') {
    return await extractTextFromPDF(buffer)
  } else if (fileType.startsWith('image/')) {
    return await extractTextFromImage(buffer)
  } else {
    throw new Error('Unsupported file type. Please upload PDF or image files.')
  }
}
