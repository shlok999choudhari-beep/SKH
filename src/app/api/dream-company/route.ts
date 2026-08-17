import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const SERPER_API_KEY = process.env.SERPER_API_KEY || ''

function getFallbackDreamData(companyName: string) {
  return {
    hiringCycles: `${companyName} conducts annual campus placement drives primarily between July and November for graduating batches. Off-campus and lateral hiring occurs continuously throughout the year on their official careers portal and referral networks.`,
    jobOpenings: `Entry-level engineering (Software Engineer / SDE-1 / Graduate Trainee) openings open in August-September. Summer internships (2-6 months) are recruited from October to February.`,
    eligibility: `B.Tech/B.E., M.Tech, MCA in Computer Science, IT, Electronics, or related engineering disciplines. No active backlogs allowed at the time of joining.`,
    skills: [
      'Data Structures & Algorithms',
      'Object-Oriented Programming (OOP)',
      'System Architecture & Design',
      'Database Management (SQL/NoSQL)',
      'Problem Solving & Clean Code',
      'Git & Cloud Fundamentals'
    ],
    technologies: ['Java / C++', 'Python', 'TypeScript / React', 'Node.js', 'PostgreSQL / MongoDB', 'Docker & AWS'],
    cgpa: `Minimum 7.0 CGPA (or 65% aggregate) throughout 10th, 12th, and undergraduate degree.`,
    experience: `Freshers eligible for graduate roles. Prior internships or open-source contributions highly advantageous.`,
    internship: `Strongly encouraged; 2-month summer internship or capstone project experience significantly boosts shortlist chances.`,
    resumeCriteria: `Clean 1-page ATS-compliant format highlighting quantifiable project impacts, LeetCode / competitive programming ratings, Hackathon wins, and tech stack proficiencies.`,
    atsKeywords: [
      'Data Structures',
      'Algorithms',
      'Distributed Systems',
      'REST APIs',
      'Microservices',
      'CI/CD',
      'Scalability',
      companyName
    ],
    selectionProcess: `1. Online Assessment (DSA & Aptitude)\n2. Technical Round 1 (Data Structures & Coding)\n3. Technical Round 2 (System Design & Core CS Concepts)\n4. Hiring Manager & Cultural Fit Round\n5. HR Discussion & Offer Rollout`,
    assessmentPattern: `90-120 minute online test consisting of 2-3 algorithmic coding challenges (Medium to Hard difficulty) + 15-20 MCQs on CS fundamentals (OS, DBMS, CN).`,
    dsaTopics: ['Arrays & Strings', 'Binary Trees & BSTs', 'Dynamic Programming', 'Graph Algorithms', 'Heap & Priority Queues'],
    previousQuestions: [
      { title: `${companyName} Top Interview Experiences (GeeksforGeeks)`, link: `https://www.geeksforgeeks.org/tag/${companyName.toLowerCase().replace(/\s+/g, '-')}/` },
      { title: `${companyName} Company Tagged Problems (LeetCode)`, link: 'https://leetcode.com/problemset/all/' },
      { title: `${companyName} Interview Questions & Reviews (Glassdoor)`, link: 'https://www.glassdoor.com/Interview/index.htm' }
    ],
    interviewBank: [
      { title: 'LeetCode Top 150 Interview Study Plan', link: 'https://leetcode.com/studyplan/top-interview-150/' },
      { title: 'NeetCode 150 Curated DSA Roadmap', link: 'https://neetcode.io/practice' },
      { title: 'System Design Primer by Donne Martin', link: 'https://github.com/donnemartin/system-design-primer' }
    ],
    systemDesign: `For SDE-1: High-level understanding of load balancing, caching (Redis), database indexing, API rate limiting, and designing scalable microservices.`,
    projects: `Full-stack applications with authentication, live WebSocket/caching integration, containerization (Docker), or deployed machine learning pipelines with clear business problem solving.`,
    behavioral: `STAR methodology based questions: "Tell me about a challenging technical bug and how you resolved it", "Describe a time you handled conflicting team priorities", "Why ${companyName}?".`,
    culture: `Customer-obsessed, high engineering standards, ownership mindset, data-driven decision making, and collaborative problem solving.`,
    salary: `Competitive compensation package for entry-level engineering: ₹12 LPA – ₹32 LPA (Base salary + Performance bonus + Stock RSUs/ESOPs + Benefits).`,
    _source: 'curated_fallback',
    _timestamp: new Date().toISOString()
  }
}

export async function POST(req: NextRequest) {
  let companyName = 'Target Company'
  try {
    const body = await req.json()
    companyName = body.companyName || 'Target Company'

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // 1. Fetch web search results for context (Safe wrapper)
    let context = ''
    if (SERPER_API_KEY) {
      try {
        const searchResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: `${companyName} hiring process interview questions eligibility criteria placement salary`,
            num: 10
          })
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.organic && Array.isArray(searchData.organic)) {
            context = searchData.organic.slice(0, 8).map((item: any) => 
              `${item.title}: ${item.snippet || ''}`
            ).join('\n\n')
          }
        }
      } catch (serperErr) {
        console.warn('Serper search fallback:', serperErr)
      }
    }

    // 2. Query Groq AI with reliable model
    if (GROQ_API_KEY) {
      const modelsToTry = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']
      
      for (const model of modelsToTry) {
        try {
          const prompt = `Based on the following context and domain knowledge about "${companyName}", generate comprehensive hiring and placement preparation insights.

Search Context:
${context || `Information about hiring, placement, and engineering roles at ${companyName}.`}

Respond strictly in valid JSON format with this exact structure (no markdown fences, no explanatory text, pure JSON only):
{
  "hiringCycles": "Detailed hiring cycle timing (months/seasons)",
  "jobOpenings": "Job opening patterns and timing",
  "eligibility": "Eligibility criteria (degrees, branches, backlogs)",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
  "technologies": ["Tech1", "Tech2", "Tech3", "Tech4", "Tech5"],
  "cgpa": "Minimum CGPA / aggregate requirement",
  "experience": "Prior experience requirements",
  "internship": "Internship requirements or preferences",
  "resumeCriteria": "Resume shortlisting criteria",
  "atsKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "selectionProcess": "Detailed stages of the hiring pipeline",
  "assessmentPattern": "Online assessment pattern (duration, sections, questions)",
  "dsaTopics": ["Arrays & Strings", "Trees & BST", "Dynamic Programming", "Graphs", "Binary Search"],
  "previousQuestions": [{"title": "Question source 1", "link": "url1"}, {"title": "Question source 2", "link": "url2"}],
  "interviewBank": [{"title": "Interview resource 1", "link": "url1"}, {"title": "Interview resource 2", "link": "url2"}],
  "systemDesign": "System design expectations",
  "projects": "Types of portfolio projects expected",
  "behavioral": "Behavioral / HR questions asked",
  "culture": "Company culture and values",
  "salary": "Salary and compensation range"
}`

          const response = await axios.post(
            GROQ_API_URL,
            {
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert career advisor. Output valid JSON only, without any markdown code fences or explanatory prose.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              model: model,
              temperature: 0.2,
              max_tokens: 3000
            },
            {
              headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          )

          const content = response.data.choices[0]?.message?.content
          if (content) {
            let jsonStr = content.trim()
            const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
            if (codeBlockMatch) {
              jsonStr = codeBlockMatch[1]
            }

            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const dreamData = JSON.parse(jsonMatch[0])
              dreamData._source = 'live_ai'
              dreamData._model = model
              dreamData._timestamp = new Date().toISOString()
              return NextResponse.json(dreamData)
            }

            const dreamData = JSON.parse(jsonStr)
            dreamData._source = 'live_ai'
            dreamData._model = model
            dreamData._timestamp = new Date().toISOString()
            return NextResponse.json(dreamData)
          }
        } catch (modelErr: any) {
          console.warn(`Groq model ${model} failed, trying next fallback:`, modelErr.response?.data?.error?.message || modelErr.message)
        }
      }
    }

    // 3. Graceful fallback if AI is unreachable
    console.log(`Using curated fallback data for ${companyName}`)
    return NextResponse.json(getFallbackDreamData(companyName))

  } catch (error: any) {
    console.error('Dream Company API Exception:', error.message)
    return NextResponse.json(getFallbackDreamData(companyName))
  }
}
