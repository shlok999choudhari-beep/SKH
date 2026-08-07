import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function analyzeResumeWithGroq(resumeText: string) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume analyzer. Analyze resumes and provide structured feedback in JSON format only.'
          },
          {
            role: 'user',
            content: `Analyze this resume and provide a detailed analysis in JSON format with these sections:
            
Resume Text:
${resumeText}

Provide response in this exact JSON structure (no markdown, just pure JSON):
{
  "summary": "Brief 2-3 sentence overview",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "skills": {
    "technical": ["skill1", "skill2", "skill3"],
    "soft": ["skill1", "skill2"]
  },
  "experience_years": number,
  "education_level": "string",
  "ats_score": number (0-100),
  "recommendations": ["rec1", "rec2", "rec3"],
  "missing_keywords": ["keyword1", "keyword2"],
  "overall_rating": number (0-10)
}`
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const content = response.data.choices[0].message.content
    
    // Extract JSON from markdown code blocks if present
    let jsonStr = content
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1]
    }
    
    // Try to find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return JSON.parse(jsonStr)
  } catch (error: any) {
    console.error('Groq API Error:', error.response?.data || error.message)
    throw new Error('Failed to analyze resume with Groq AI')
  }
}
