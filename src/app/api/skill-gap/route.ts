import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { extractResumeText } from '@/lib/resumeExtractor'
import { prisma } from '@/lib/prisma'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File
    const jobDescFile = formData.get('jobDescription') as File
    
    if (!resumeFile || !jobDescFile) {
      return NextResponse.json({ error: 'Both resume and job description required' }, { status: 400 })
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(resumeFile.type) || !validTypes.includes(jobDescFile.type)) {
      return NextResponse.json({ error: 'Invalid file type. Upload PDF or image.' }, { status: 400 })
    }

    const resumeText = await extractResumeText(resumeFile)
    const jobDescText = await extractResumeText(jobDescFile)
    
    if (!resumeText || !jobDescText) {
      return NextResponse.json({ error: 'Could not extract text from files' }, { status: 400 })
    }

    const analysis = await analyzeSkillGap(resumeText, jobDescText)

    // Store the analysis in database
    await prisma.skillGapAnalysis.create({
      data: {
        studentId: session.userId,
        resumeName: resumeFile.name,
        jobDescName: jobDescFile.name,
        analysisData: JSON.stringify(analysis)
      }
    })

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (error: any) {
    console.error('Skill gap analysis error:', error)
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}

async function analyzeSkillGap(resumeText: string, jobDescText: string) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

  const response = await axios.post(
    GROQ_API_URL,
    {
      messages: [
        {
          role: 'system',
          content: 'You are an expert career advisor analyzing skill gaps.'
        },
        {
          role: 'user',
          content: `Compare resume with job description and provide skill gap analysis in JSON:

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescText}

JSON format:
{
  "match_percentage": number,
  "matching_skills": ["skill1"],
  "missing_skills": ["skill1"],
  "skills_to_learn": [{"skill": "name", "priority": "High", "learning_time": "2 weeks"}],
  "experience_gap": "text",
  "education_gap": "text",
  "recommendations": ["rec1"],
  "learning_path": ["step1"],
  "summary": "text"
}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2500
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
