import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const { analysis } = await request.json()

    const doc = new jsPDF() as any
    let yPos = 20

    // Title
    doc.setFontSize(24)
    doc.setTextColor(16, 185, 129)
    doc.text('Behavioral Analysis Report', 20, yPos)
    yPos += 15

    // Overall Score
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(`Overall Score: ${analysis.overallScore}/100`, 20, yPos)
    yPos += 15

    // Score Breakdown
    doc.setFontSize(14)
    doc.text('Score Breakdown:', 20, yPos)
    yPos += 10
    doc.setFontSize(11)
    
    Object.entries(analysis.scores || {}).forEach(([key, value]: any) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim()
      doc.text(`${label}: ${value}/10`, 30, yPos)
      yPos += 7
    })
    yPos += 10

    // Summary
    doc.setFontSize(14)
    doc.text('Summary:', 20, yPos)
    yPos += 10
    doc.setFontSize(10)
    const summaryLines = doc.splitTextToSize(analysis.summary, 170)
    doc.text(summaryLines, 20, yPos)
    yPos += summaryLines.length * 7 + 10

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Strengths
    doc.setFontSize(14)
    doc.text('Strengths:', 20, yPos)
    yPos += 10
    doc.setFontSize(10)
    
    (analysis.strengths || []).forEach((strength: string) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      const lines = doc.splitTextToSize(`• ${strength}`, 170)
      doc.text(lines, 25, yPos)
      yPos += lines.length * 7
    })
    yPos += 10

    // Areas for Improvement
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.text('Areas for Improvement:', 20, yPos)
    yPos += 10
    doc.setFontSize(10)
    
    (analysis.improvements || []).forEach((improvement: string) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      const lines = doc.splitTextToSize(`• ${improvement}`, 170)
      doc.text(lines, 25, yPos)
      yPos += lines.length * 7
    })
    yPos += 10

    // Recommendations
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.text('Recommendations:', 20, yPos)
    yPos += 10
    doc.setFontSize(10)
    const recLines = doc.splitTextToSize(analysis.recommendations, 170)
    doc.text(recLines, 20, yPos)

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=behavioral-analysis.pdf'
      }
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
