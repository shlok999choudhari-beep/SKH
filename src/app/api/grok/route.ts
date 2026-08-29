import { NextResponse } from 'next/server';
import { validateLearningScope, BLOCKED_SCOPE_MESSAGE } from '@/lib/learningScopeGuard';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const scopeCheck = await validateLearningScope(prompt.trim());
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { error: BLOCKED_SCOPE_MESSAGE, blocked: true },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a career advisor analyzing company requirements and creating skill assessments. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'openai/gpt-oss-120b',
        temperature: 0.5,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', response.status, errorData);
      return NextResponse.json(
        { error: `Groq API error: ${response.status} - ${errorData}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to communicate with AI' },
      { status: 500 }
    );
  }
}
