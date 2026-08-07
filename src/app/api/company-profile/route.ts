import { NextRequest, NextResponse } from 'next/server'

const SERPER_API_KEY = process.env.SERPER_API_KEY || 'b15321aee5370f5e506e764fb6141b8fa80c4d0f'

export async function POST(req: NextRequest) {
  try {
    const { companyName } = await req.json()

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Fetch company overview and information
    const overviewResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `${companyName} company overview culture benefits`,
        num: 5
      })
    })

    // Fetch job openings
    const jobsResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `${companyName} careers jobs openings`,
        num: 5
      })
    })

    // Fetch news and insights
    const insightsResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `${companyName} news latest updates 2024`,
        num: 8
      })
    })

    if (!overviewResponse.ok || !jobsResponse.ok || !insightsResponse.ok) {
      throw new Error('Serper API request failed')
    }

    const overviewData = await overviewResponse.json()
    const jobsData = await jobsResponse.json()
    const insightsData = await insightsResponse.json()

    // Extract overview from knowledge graph or first result
    let overview = ''
    if (overviewData.knowledgeGraph?.description) {
      overview = overviewData.knowledgeGraph.description
    } else if (overviewData.organic && overviewData.organic[0]?.snippet) {
      overview = overviewData.organic[0].snippet
    }

    // Extract key points from search results
    const keyPoints: string[] = []
    if (overviewData.organic) {
      overviewData.organic.slice(0, 5).forEach((item: any) => {
        if (item.snippet) {
          const sentences = item.snippet.split('.').filter((s: string) => s.trim().length > 20)
          if (sentences[0]) {
            keyPoints.push(sentences[0].trim() + '.')
          }
        }
      })
    }

    // Extract job listings
    const jobs = jobsData.organic?.slice(0, 5).map((item: any) => ({
      title: item.title,
      description: item.snippet,
      link: item.link
    })) || []

    // Extract insights
    const insights = insightsData.organic?.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      date: item.date
    })) || []

    const companyProfile = {
      overview,
      keyPoints: keyPoints.slice(0, 6),
      jobs,
      insights,
      knowledgeGraph: overviewData.knowledgeGraph || null
    }

    return NextResponse.json(companyProfile)
  } catch (error) {
    console.error('Company profile error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch company profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
