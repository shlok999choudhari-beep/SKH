import { NextRequest, NextResponse } from 'next/server'

const SERPER_API_KEY = process.env.SERPER_API_KEY || 'b15321aee5370f5e506e764fb6141b8fa80c4d0f'

export async function POST(req: NextRequest) {
  try {
    const { title, skills, experience, location, description } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Role title is required' }, { status: 400 })
    }

    // Build search query for market insights
    const searchQuery = `${title} job requirements skills responsibilities ${location || ''}`

    // Fetch market insights from Serper API
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 10
      })
    })

    if (!response.ok) {
      console.error('Serper API error:', response.status, response.statusText)
      throw new Error('Serper API request failed')
    }

    const data = await response.json()

    // Generate enhanced description if not provided
    let enhancedDescription = description
    if (!description && data.organic && data.organic.length > 0) {
      // Extract key information from search results
      const snippets = data.organic.slice(0, 3).map((item: any) => item.snippet).filter(Boolean)
      if (snippets.length > 0) {
        enhancedDescription = `${title} position with focus on ${skills || 'relevant technical skills'}. ${snippets[0].substring(0, 200)}...`
      } else {
        enhancedDescription = `${title} position requiring strong technical skills and problem-solving abilities. Ideal candidate will work on challenging projects and collaborate with cross-functional teams.`
      }
    }

    // Generate enhanced skills if not provided
    let enhancedSkills = skills
    if (!skills && data.organic && data.organic.length > 0) {
      // Try to extract common tech skills from results
      const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Git', 'Agile']
      const foundSkills = commonSkills.filter(skill => 
        data.organic.some((item: any) => 
          item.snippet?.toLowerCase().includes(skill.toLowerCase()) ||
          item.title?.toLowerCase().includes(skill.toLowerCase())
        )
      )
      enhancedSkills = foundSkills.length > 0 ? foundSkills.slice(0, 5).join(', ') : 'Based on market research'
    }

    const generatedRole = {
      title: title,
      skills: enhancedSkills || 'Technical skills based on role requirements',
      experience: experience || 'Entry to Mid-level (0-3 years)',
      location: location || 'Remote/Hybrid/On-site',
      description: enhancedDescription || `${title} position requiring strong technical skills and problem-solving abilities. Ideal candidate will work on challenging projects and collaborate with cross-functional teams.`,
      insights: data.organic || [],
      searchInfo: {
        totalResults: data.searchInformation?.totalResults || 0,
        searchTime: data.searchInformation?.searchTime || 0
      }
    }

    return NextResponse.json(generatedRole)
  } catch (error) {
    console.error('Job role creator error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate job role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
