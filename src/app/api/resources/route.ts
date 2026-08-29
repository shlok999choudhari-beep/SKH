import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'
import { validateLearningScope, filterLearningSearchResults, BLOCKED_SCOPE_MESSAGE } from '@/lib/learningScopeGuard'

const SERPER_API_KEY = process.env.SERPER_API_KEY || '5aeb9cd3c96f152dde1faf0b242e8a72a121abda'

const resourceSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  type: z.string().optional(),
  category: z.string().min(2, 'Category is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  availability: z.string().optional(),
  facilities: z.string().optional(),
  status: z.string().optional(),
  sharingEnabled: z.boolean().optional(),
  availableToStudents: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    const excludeInstitutionId = searchParams.get('excludeInstitutionId')
    const sharingEnabled = searchParams.get('sharingEnabled')
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const availability = searchParams.get('availability')
    const capacityMin = searchParams.get('capacityMin')
    const search = searchParams.get('search')

    let whereClause: any = {}

    if (institutionId) {
      whereClause.institutionId = parseInt(institutionId, 10)
    }

    if (excludeInstitutionId) {
      whereClause.institutionId = {
        not: parseInt(excludeInstitutionId, 10)
      }
    }

    if (sharingEnabled !== null) {
      whereClause.sharingEnabled = sharingEnabled === 'true'
    }

    if (category && category !== 'all') {
      whereClause.category = {
        equals: category,
        mode: 'insensitive'
      }
    }

    if (location) {
      whereClause.location = {
        contains: location,
        mode: 'insensitive'
      }
    }

    if (availability) {
      whereClause.availability = {
        contains: availability,
        mode: 'insensitive'
      }
    }

    if (capacityMin) {
      whereClause.capacity = {
        gte: parseInt(capacityMin, 10)
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { facilities: { contains: search, mode: 'insensitive' } }
      ]
    }

    const resources = await prisma.resource.findMany({
      where: whereClause,
      include: {
        institution: {
          select: { name: true }
        }
      },
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

      // ── Centralized LearningScopeGuard Validation ──
      const scopeCheck = await validateLearningScope(query)
      if (!scopeCheck.allowed) {
        return NextResponse.json({
          success: false,
          blocked: true,
          error: scopeCheck.blockedMessage || BLOCKED_SCOPE_MESSAGE,
          message: scopeCheck.blockedMessage || BLOCKED_SCOPE_MESSAGE,
          resources: {
            videos: [],
            documentation: [],
            communities: []
          }
        })
      }

      const region = (typeof body.region === 'string' && body.region.trim()) ? body.region.trim().toLowerCase() : 'us'
      const language = (typeof body.language === 'string' && body.language.trim()) ? body.language.trim().toLowerCase() : 'en'
      const type = (typeof body.type === 'string' && body.type.trim()) ? body.type.trim().toLowerCase() : 'all'

      const languageLabels: Record<string, string> = {
        en: '',
        hi: 'in Hindi हिंदी',
        es: 'en español',
        fr: 'en français',
        de: 'auf Deutsch',
        ta: 'in Tamil தமிழ்',
        te: 'in Telugu తెలుగు',
        bn: 'in Bengali বাংলা',
        mr: 'in Marathi मराठी',
        ja: 'in Japanese 日本語',
        pt: 'em português',
        ar: 'باللغة العربية'
      }

      const langSuffix = languageLabels[language] ? ` ${languageLabels[language]}` : ''

      let videoQuery = `${query} tutorial course${langSuffix}`
      if (type === 'playlist') {
        videoQuery = `${query} playlist full course tutorial series${langSuffix}`
      } else if (type === 'short') {
        videoQuery = `${query} crash course in 10 minutes quick overview${langSuffix}`
      } else if (type === 'course') {
        videoQuery = `${query} complete bootcamp masterclass${langSuffix}`
      }

      const docsQuery = `${query} official documentation guide tutorial${langSuffix}`
      const booksQuery = `${query} free online book open textbook read online github`
      const notesQuery = `${query} revision notes cheat sheet quick reference summary`
      const commQuery = `${query} community discord telegram reddit forum`

      try {
        const serperHeaders = { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' }
        const basePayload = { gl: region, hl: language, num: 6 }

        // Fetch videos, documentation, books, notes, and communities in parallel via Serper API
        const [videosRes, docsRes, booksRes, notesRes, commRes] = await Promise.all([
          fetch('https://google.serper.dev/videos', {
            method: 'POST',
            headers: serperHeaders,
            body: JSON.stringify({ ...basePayload, q: videoQuery })
          }),
          fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: serperHeaders,
            body: JSON.stringify({ ...basePayload, q: docsQuery })
          }),
          fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: serperHeaders,
            body: JSON.stringify({ ...basePayload, q: booksQuery, num: 4 })
          }),
          fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: serperHeaders,
            body: JSON.stringify({ ...basePayload, q: notesQuery, num: 4 })
          }),
          fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: serperHeaders,
            body: JSON.stringify({ ...basePayload, q: commQuery })
          })
        ])

        const [videosData, docsData, booksData, notesData, commData] = await Promise.all([
          videosRes.json().catch(() => ({})),
          docsRes.json().catch(() => ({})),
          booksRes.json().catch(() => ({})),
          notesRes.json().catch(() => ({})),
          commRes.json().catch(() => ({}))
        ])

        const rawVideos = (videosData.videos || []).map((v: any) => ({
          title: v.title || `${query} Tutorial`,
          link: v.link || `https://www.youtube.com/results?search_query=${encodeURIComponent(videoQuery)}`,
          channel: v.channel || 'YouTube',
          imageUrl: v.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'
        }))

        const officialDocs = (docsData.organic || []).map((d: any) => ({
          title: d.title || `${query} Documentation`,
          snippet: d.snippet || `Official guides, API references, and documentation for ${query}.`,
          link: d.link || `https://google.com/search?q=${encodeURIComponent(query + ' documentation')}`,
          docType: 'official_docs'
        }))

        const books = (booksData.organic || []).map((b: any) => ({
          title: b.title || `${query} Free Online Book`,
          snippet: b.snippet || `Open access textbook and comprehensive reading guide for ${query}.`,
          link: b.link || `https://google.com/search?q=${encodeURIComponent(query + ' free online book')}`,
          docType: 'book'
        }))

        const notes = (notesData.organic || []).map((n: any) => ({
          title: n.title || `${query} Cheat Sheet & Quick Notes`,
          snippet: n.snippet || `Concise revision summary, syntax cheat sheet, and study notes for ${query}.`,
          link: n.link || `https://google.com/search?q=${encodeURIComponent(query + ' cheat sheet notes')}`,
          docType: 'notes'
        }))

        const rawDocumentation = [...officialDocs, ...books, ...notes]

        const rawCommunities = (commData.organic || []).map((c: any) => ({
          title: c.title || `${query} Community`,
          snippet: c.snippet || `Join discussions, ask questions, and collaborate with developers learning ${query}.`,
          link: c.link || `https://reddit.com/r/search?q=${encodeURIComponent(query)}`
        }))

        // Sanitize results using LearningScopeGuard result filter
        const sanitized = filterLearningSearchResults({
          videos: rawVideos,
          documentation: rawDocumentation,
          communities: rawCommunities
        })

        const videos = sanitized.videos || []
        const documentation = sanitized.documentation || []
        const communities = sanitized.communities || []

        // Fallbacks if search returned empty results
        if (videos.length === 0) {
          videos.push({
            title: `${query} ${type === 'playlist' ? 'Full Playlist' : type === 'short' ? 'Crash Course' : 'Complete Tutorial'}`,
            link: `https://www.youtube.com/results?search_query=${encodeURIComponent(videoQuery)}`,
            channel: 'YouTube Learning',
            imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60'
          })
        }

        if (documentation.length === 0) {
          documentation.push({
            title: `${query} Documentation & Official Guides`,
            snippet: `Explore official tutorials, API documentation, and best practices for ${query}.`,
            link: `https://www.google.com/search?q=${encodeURIComponent(query + ' documentation')}`,
            docType: 'official_docs'
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
          scopeCategory: scopeCheck.category,
          filtersApplied: {
            region,
            language,
            type,
            query
          },
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
          scopeCategory: scopeCheck.category,
          filtersApplied: {
            region,
            language,
            type,
            query
          },
          resources: {
            videos: [{
              title: `${query} Complete Tutorial`,
              link: `https://www.youtube.com/results?search_query=${encodeURIComponent(videoQuery)}`,
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
    const session = await getSession()
    if (!session || session.role !== 'institution-admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { institutionId: true }
    })
    if (!user || !user.institutionId) {
      return NextResponse.json({ error: 'Institution profile not found' }, { status: 404 })
    }

    const validatedData = resourceSchema.parse(body)
    
    const result = await prisma.resource.create({
      data: {
        institutionId: user.institutionId,
        name: validatedData.name,
        type: validatedData.type || validatedData.category || 'other',
        category: validatedData.category,
        description: validatedData.description || null,
        location: validatedData.location || null,
        capacity: validatedData.capacity || null,
        availability: validatedData.availability || null,
        facilities: validatedData.facilities || null,
        status: validatedData.status || 'active',
        sharingEnabled: validatedData.sharingEnabled !== undefined ? validatedData.sharingEnabled : false,
        availableToStudents: validatedData.availableToStudents !== undefined ? validatedData.availableToStudents : false
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

