import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { analysis, userQuery } = await request.json()
    
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis data required' }, { status: 400 })
    }

    const roadmap = await generateRoadmap(analysis, userQuery)

    return NextResponse.json({
      success: true,
      roadmap
    })

  } catch (error: any) {
    console.error('Roadmap generation error:', error)
    return NextResponse.json({ error: error.message || 'Roadmap generation failed' }, { status: 500 })
  }
}

async function generateRoadmap(analysis: any, userQuery?: string) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

  const missingSkills = analysis.missing_skills || []
  const skillsToLearn = analysis.skills_to_learn || []

  const prompt = `Create a detailed 4-6 week learning roadmap for these missing skills:

MISSING SKILLS: ${missingSkills.join(', ')}

SKILLS TO LEARN WITH PRIORITY:
${skillsToLearn.map((s: any) => `- ${s.skill} (Priority: ${s.priority}, Time: ${s.learning_time})`).join('\n')}

${userQuery ? `USER QUERY: ${userQuery}\n` : ''}

Generate a JSON response with this structure:
{
  "critical_skills": ["skill1", "skill2"],
  "roadmap": [
    {
      "week": 1,
      "title": "Week title",
      "focus": "Main focus area",
      "skills": ["skill1", "skill2"],
      "tasks": [
        {
          "task": "Task description",
          "duration": "2 hours",
          "resources": [
            {
              "title": "Resource title",
              "type": "video",
              "search_query": "exact YouTube search query"
            }
          ]
        }
      ],
      "milestone": "What you'll achieve"
    }
  ],
  "daily_schedule": {
    "hours_per_day": "2-3 hours",
    "breakdown": "Study plan breakdown"
  },
  "tips": ["tip1", "tip2"]
}`

  const response = await axios.post(
    GROQ_API_URL,
    {
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach creating personalized learning roadmaps. Always provide specific YouTube search queries for learning resources.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 3000
    },
    {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )

  const content = response.data.choices[0].message.content
  let jsonStr = content
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) jsonStr = codeBlockMatch[1]
  
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])
  
  return JSON.parse(jsonStr)
}
