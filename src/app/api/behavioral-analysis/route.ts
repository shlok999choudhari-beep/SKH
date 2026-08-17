import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 })
    }

    const groq = new Groq({ apiKey })

    const { transcript, duration, videoSnapshots } = await request.json()

    const analysisPrompt = `
You are an expert HR analyst. Analyze this behavioral interview and provide a comprehensive assessment.

Interview Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds

Transcript:
${transcript.map((t: any) => `${t.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${t.text}`).join('\n\n')}

Video Analysis: ${videoSnapshots.length} snapshots captured for body language analysis.

Provide a detailed analysis in JSON format with:
{
  "overallScore": number (0-100),
  "scores": {
    "communication": number (0-10),
    "confidence": number (0-10),
    "problemSolving": number (0-10),
    "leadership": number (0-10),
    "teamwork": number (0-10),
    "adaptability": number (0-10),
    "emotionalIntelligence": number (0-10),
    "professionalism": number (0-10)
  },
  "summary": "string - 2-3 paragraph overall assessment",
  "strengths": ["array of 4-6 specific strengths observed"],
  "improvements": ["array of 4-6 specific areas to improve"],
  "recommendations": "string - detailed recommendations for improvement",
  "bodyLanguage": "string - assessment of body language and non-verbal communication",
  "starMethodUsage": "string - how well they used STAR method",
  "responseQuality": "string - quality and depth of responses"
}

Be specific, constructive, and professional. Focus on observable behaviors and concrete examples from the transcript.
`

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR analyst specializing in behavioral interview assessment. Provide detailed, constructive feedback.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('Error generating analysis:', error)
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}
