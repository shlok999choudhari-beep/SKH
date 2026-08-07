import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const SERPER_API_KEY = process.env.SERPER_API_KEY || 'b15321aee5370f5e506e764fb6141b8fa80c4d0f'

export async function POST(req: NextRequest) {
  try {
    const { companyName } = await req.json()

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Fetch web search results for context
    const searchResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `${companyName} hiring process interview questions eligibility criteria placement`,
        num: 10
      })
    })

    const searchData = await searchResponse.json()
    
    // Extract context from search results
    let context = ''
    if (searchData.organic) {
      context = searchData.organic.slice(0, 8).map((item: any) => 
        `${item.title}: ${item.snippet}`
      ).join('\n\n')
    }

    // Use Groq to analyze and structure the information
    const response = await axios.post(
      GROQ_API_URL,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor and placement advisor. Provide comprehensive hiring information for companies in JSON format only.'
          },
          {
            role: 'user',
            content: `Based on the following web search results about ${companyName}, provide comprehensive hiring and placement information.

Search Results:
${context}

Provide response in this exact JSON structure (no markdown, just pure JSON):
{
  "hiringCycles": "Detailed information about when the company typically hires (e.g., campus placements in July-September, off-campus throughout year)",
  "jobOpenings": "Information about job opening patterns and timing",
  "eligibility": "Eligibility criteria including degree requirements, branches accepted, etc.",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "technologies": ["tech1", "tech2", "tech3", "tech4"],
  "cgpa": "Minimum CGPA or percentage requirement",
  "experience": "Prior experience requirements for freshers/experienced",
  "internship": "Internship requirements or preferences",
  "resumeCriteria": "What the company looks for in resumes",
  "atsKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "selectionProcess": "Detailed selection process stages (e.g., Online Test -> Technical Interview -> HR Interview)",
  "assessmentPattern": "Online assessment pattern details (MCQs, coding questions, duration, etc.)",
  "dsaTopics": ["Arrays", "Strings", "Dynamic Programming", "Trees", "Graphs"],
  "previousQuestions": [{"title": "Question source 1", "link": "url1"}, {"title": "Question source 2", "link": "url2"}],
  "interviewBank": [{"title": "Interview resource 1", "link": "url1"}, {"title": "Interview resource 2", "link": "url2"}],
  "systemDesign": "System design expectations for the role",
  "projects": "Types of projects expected or preferred",
  "behavioral": "Common behavioral/HR questions asked",
  "culture": "Company culture and values",
  "salary": "Salary range and compensation structure for freshers/experienced"
}

Important: 
- Use real information from search results when available
- For links, use actual URLs from search results or common resources like GeeksforGeeks, LeetCode, Glassdoor
- Be specific and detailed
- If information is not available in search results, provide general industry-standard information for ${companyName}`
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
    
    // Extract JSON from markdown code blocks if present
    let jsonStr = content
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1]
    }
    
    // Try to find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const dreamData = JSON.parse(jsonMatch[0])
      return NextResponse.json(dreamData)
    }
    
    const dreamData = JSON.parse(jsonStr)
    return NextResponse.json(dreamData)
  } catch (error: any) {
    console.error('Dream Company API Error:', error.response?.data || error.message)
    return NextResponse.json({ 
      error: 'Failed to fetch dream company data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
