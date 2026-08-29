import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { validateLearningScope, validateAiResponse, BLOCKED_SCOPE_MESSAGE } from '@/lib/learningScopeGuard'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Step 1: Enforce Centralized LearningScopeGuard
    const scopeCheck = await validateLearningScope(message.trim())
    if (!scopeCheck.allowed) {
      return NextResponse.json({
        response: BLOCKED_SCOPE_MESSAGE,
        blocked: true
      })
    }

    const systemPrompt = `You are an expert AI Career Mentor specializing in:
- Job preparation and interview strategies
- Learning paths and skill development
- Project ideas and portfolio building
- Career guidance and industry trends
- Resume and LinkedIn optimization

CRITICAL SCOPE RULE:
You strictly assist students with educational, technical, career, and personal development topics. Never answer unrelated entertainment, gambling, movie recommendations, sports scores, or shopping requests.

Focus on practical, actionable advice. Be encouraging but realistic. Provide specific examples and resources when relevant. Keep responses concise (2-4 paragraphs) unless asked for detailed explanations.`

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

    const rawAiResponse = response.data.choices[0]?.message?.content || ''
    const { isSafe, sanitizedResponse } = validateAiResponse(rawAiResponse)

    return NextResponse.json({
      response: sanitizedResponse || "I am here to guide your studies and career preparation. What learning topic would you like to explore today?",
      blocked: !isSafe
    })
  } catch (error: any) {
    console.error('Mentor Chat API Error:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to get response from AI mentor' },
      { status: 500 }
    )
  }
}
