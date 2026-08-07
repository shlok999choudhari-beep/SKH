import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SERPER_API_KEY = process.env.SERPER_API_KEY || '5aeb9cd3c96f152dde1faf0b242e8a72a121abda'

const resourceSchema = z.object({
  institution_id: z.number(),
  name: z.string().min(2, 'Name is required'),
  type: z.string().min(2, 'Type is required'),
  capacity: z.number().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')

    let whereClause = {}
    if (institutionId) {
      whereClause = { institutionId: parseInt(institutionId, 10) }
    }

    const resources = await prisma.resource.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ resources })
  } catch (error: any) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 1. Student Learning Resources Search
    if (body.query && typeof body.query === 'string') {
      const query = body.query.trim()
      if (!query) {
        return NextResponse.json({ error: 'Query is empty' }, { status: 400 })
      }

      try {
        // Fetch videos, documentation, and communities in parallel via Serper API
        const [videosRes, docsRes, commRes] = await Promise.all([
          fetch('https://google.serper.dev/videos', {
            method: 'POST',
            headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: `${query} tutorial course`, num: 6 })
          }),
          fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: `${query} official documentation guide tutorial`, num: 6 })
          }),
          fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: `${query} community discord telegram reddit forum`, num: 6 })
          })
        ])

        const [videosData, docsData, commData] = await Promise.all([
          videosRes.json().catch(() => ({})),
          docsRes.json().catch(() => ({})),
          commRes.json().catch(() => ({}))
        ])

        const videos = (videosData.videos || []).map((v: any) => ({
          title: v.title || `${query} Tutorial`,
          link: v.link || `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          channel: v.channel || 'YouTube',
          imageUrl: v.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'
        }))

        const documentation = (docsData.organic || []).map((d: any) => ({
          title: d.title || `${query} Documentation`,
          snippet: d.snippet || `Official guides, API references, and documentation for ${query}.`,
          link: d.link || `https://google.com/search?q=${encodeURIComponent(query + ' documentation')}`
        }))

        const communities = (commData.organic || []).map((c: any) => ({
          title: c.title || `${query} Community`,
          snippet: c.snippet || `Join discussions, ask questions, and collaborate with developers learning ${query}.`,
          link: c.link || `https://reddit.com/r/search?q=${encodeURIComponent(query)}`
        }))

        // Fallbacks if search returned empty results
        if (videos.length === 0) {
          videos.push({
            title: `${query} Full Course & Complete Tutorial`,
            link: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' tutorial')}`,
            channel: 'YouTube Learning',
            imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'
          })
        }

        if (documentation.length === 0) {
          documentation.push({
            title: `${query} Documentation & Official Guides`,
            snippet: `Explore official tutorials, API documentation, and best practices for ${query}.`,
            link: `https://www.google.com/search?q=${encodeURIComponent(query + ' documentation')}`
          })
        }

        if (communities.length === 0) {
          communities.push({
            title: `${query} Developer Community`,
            snippet: `Connect with other developers learning and working with ${query}.`,
            link: `https://reddit.com/r/programming`
          })
        }

        return NextResponse.json({
          success: true,
          resources: {
            videos,
            documentation,
            communities
          }
        })
      } catch (err: any) {
        console.error('Serper search error:', err)
        return NextResponse.json({
          success: true,
          resources: {
            videos: [{
              title: `${query} Complete Tutorial`,
              link: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
              channel: 'YouTube',
              imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'
            }],
            documentation: [{
              title: `${query} Official Documentation`,
              snippet: `Learn ${query} from basic concepts to advanced development techniques.`,
              link: `https://google.com/search?q=${encodeURIComponent(query + ' documentation')}`
            }],
            communities: [{
              title: `${query} Developer Community`,
              snippet: `Ask questions and share knowledge about ${query}.`,
              link: `https://reddit.com`
            }]
          }
        })
      }
    }

    // 2. Institution Resource Creation
    const validatedData = resourceSchema.parse(body)
    
    const result = await prisma.resource.create({
      data: {
        institutionId: validatedData.institution_id,
        name: validatedData.name,
        type: validatedData.type,
        capacity: validatedData.capacity || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      resourceId: result.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error in resource route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

