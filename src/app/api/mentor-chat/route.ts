import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    const systemPrompt = `You are an expert AI Career Mentor specializing in:
- Job preparation and interview strategies
- Learning paths and skill development
- Project ideas and portfolio building
- Career guidance and industry trends
- Resume and LinkedIn optimization

Focus on practical, actionable advice. Be encouraging but realistic. Provide specific examples and resources when relevant. Keep responses concise (2-4 paragraphs) unless asked for detailed explanations.

When discussing:
- JOBS: Cover interview prep, job search strategies, company research, salary negotiation
- LEARNING: Suggest roadmaps, courses, certifications, best practices for skill acquisition
- PROJECTS: Recommend portfolio projects, tech stacks, GitHub best practices, project ideas by skill level`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    const response = await axios.post(
      GROQ_API_URL,
      {
        messages,
        model: 'openai/gpt-oss-120b',
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const aiResponse = response.data.choices[0].message.content

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error('Mentor Chat API Error:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to get response from AI mentor' },
      { status: 500 }
    )
  }
}
