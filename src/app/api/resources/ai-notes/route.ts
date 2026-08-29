import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { validateLearningScope, BLOCKED_SCOPE_MESSAGE } from '@/lib/learningScopeGuard'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { query, language } = await request.json()

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Topic query is required' }, { status: 400 })
    }

    const topic = query.trim()

    // ── Centralized LearningScopeGuard Validation ──
    const scopeCheck = await validateLearningScope(topic)
    if (!scopeCheck.allowed) {
      return NextResponse.json({
        success: false,
        blocked: true,
        error: scopeCheck.blockedMessage || BLOCKED_SCOPE_MESSAGE,
        message: scopeCheck.blockedMessage || BLOCKED_SCOPE_MESSAGE
      })
    }
    const targetLang = language === 'hi' ? 'Hindi (हिन्दी)' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'English'

    const prompt = `Generate simple, clear, and basic revision notes for "${topic}". Keep it beginner-friendly, straightforward, and concise.
Language requested: ${targetLang}

Format strictly with this clean, simple Markdown layout:
# 📘 ${topic} — Basic Quick Notes

### 💡 What is ${topic}?
A simple, easy-to-understand 2-sentence explanation of what it is.

### 🎯 Key Benefits & Why It's Used
- **Point 1**: Simple benefit.
- **Point 2**: Simple benefit.
- **Point 3**: Simple benefit.

### 💻 Basic Example / Quick Syntax
\`\`\`
// Provide a single, short, basic 4-6 line code example with brief comment
\`\`\`

### 📌 Key Points to Remember
- Point 1 (most important takeaway)
- Point 2 (practical rule of thumb)
- Point 3 (next beginner step)

Keep it short, simple, and clean. Avoid overly complex architecture diagrams or excessive technical jargon.`

    if (!GROQ_API_KEY) {
      return NextResponse.json({
        success: true,
        topic,
        notes: `# 📘 ${topic} — Basic Quick Notes\n\n### 💡 What is ${topic}?\n${topic} is a popular technology used by developers to build modern software and web applications.\n\n### 🎯 Key Benefits\n- High performance and efficiency\n- Large active community and ecosystem\n- Easy to learn and integrate into projects\n\n### 📌 Key Points\n- Start with basic concepts\n- Practice with small hands-on projects`
      })
    }

    const groqRes = await axios.post(
      GROQ_API_URL,
      {
        messages: [
          {
            role: 'system',
            content: 'You are a friendly technical educator. You write simple, concise, and clear beginner-level study notes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'openai/gpt-oss-120b',
        temperature: 0.2,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    )

    const notesContent = groqRes.data?.choices?.[0]?.message?.content || 'AI Notes generated.'

    return NextResponse.json({
      success: true,
      topic,
      notes: notesContent
    })
  } catch (error: any) {
    console.error('AI Notes generation error:', error)
    return NextResponse.json({
      success: true,
      topic: 'Technology Guide',
      notes: '# Study Guide\n\nUnable to generate live notes right now. Please explore official documentation.'
    })
  }
}
