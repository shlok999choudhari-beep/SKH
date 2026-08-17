import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createTrainerSchema = z.object({
  user_id: z.number().optional(),
  name: z.string().min(2, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  institution_id: z.number().optional(),
  expertise_tags: z.string().optional(),
  subjects: z.string().optional(),
  bio: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const institutionId = searchParams.get('institutionId')
    const specialty = searchParams.get('specialty')
    const search = searchParams.get('search')
    
    let whereClause: any = {}
    if (institutionId) {
      whereClause.institutionId = parseInt(institutionId, 10)
    }

    if (specialty && specialty.trim().toLowerCase() !== 'all') {
      whereClause.expertiseTags = {
        contains: specialty.trim(),
        mode: 'insensitive'
      }
    }

    if (search) {
      whereClause.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { expertiseTags: { contains: search, mode: 'insensitive' } },
        { subjects: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }
      ]
    }

    const trainers = await prisma.trainer.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true }
        },
        institution: {
          select: { name: true }
        },
        sessions: {
          where: {
            status: { not: 'cancelled' },
            startTime: { gte: new Date() }
          },
          select: { id: true, startTime: true, endTime: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const mappedTrainers = trainers.map((t: any) => ({
      id: t.id,
      userId: t.userId,
      institutionId: t.institutionId,
      institutionName: t.institution?.name || 'Institution',
      name: t.user.name,
      email: t.user.email,
      expertise_tags: t.expertiseTags || '',
      expertiseTags: t.expertiseTags || '',
      subjects: t.subjects || '',
      bio: t.bio || '',
      rating: t.rating || 4.8,
      upcomingSessionsCount: t.sessions.length,
      createdAt: t.createdAt
    }))

    return NextResponse.json({ trainers: mappedTrainers })
  } catch (error: any) {
    console.error('Error fetching trainers:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createTrainerSchema.parse(body)

    let userId = validatedData.user_id
    let institutionId = validatedData.institution_id

    // Default to first institution or create default if none exists
    if (!institutionId) {
      let defaultInst = await prisma.institution.findFirst()
      if (!defaultInst) {
        defaultInst = await prisma.institution.create({
          data: {
            name: 'Main Institution',
            domain: 'main.edu',
            contactEmail: 'admin@institution.edu'
          }
        })
      }
      institutionId = defaultInst.id
    }

    // If user_id is provided, verify user exists
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    } else {
      // Create new User record for trainer
      if (!validatedData.email || !validatedData.name) {
        return NextResponse.json({ error: 'Trainer Name and Email are required' }, { status: 400 })
      }

      // Check if user with email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (existingUser) {
        // If user already exists, update role to trainer if needed and use their ID
        userId = existingUser.id
        if (existingUser.role !== 'trainer') {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'trainer' }
          })
        }
      } else {
        const hashedPassword = await bcrypt.hash(validatedData.password || 'trainer123', 10)
        const newUser = await prisma.user.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
            role: 'trainer',
            institutionId: institutionId || null,
            status: 'active'
          }
        })
        userId = newUser.id
      }
    }

    // Check if trainer profile already exists for this user
    const existingTrainer = await prisma.trainer.findFirst({
      where: { userId }
    })

    if (existingTrainer) {
      // Update existing trainer profile
      const updated = await prisma.trainer.update({
        where: { id: existingTrainer.id },
        data: {
          expertiseTags: validatedData.expertise_tags || existingTrainer.expertiseTags,
          subjects: validatedData.subjects || existingTrainer.subjects,
          bio: validatedData.bio || existingTrainer.bio,
          institutionId: institutionId || existingTrainer.institutionId
        }
      })
      return NextResponse.json({ success: true, trainerId: updated.id, updated: true }, { status: 200 })
    }

    // Create new Trainer profile
    const newTrainer = await prisma.trainer.create({
      data: {
        userId: userId!,
        institutionId: institutionId || 1,
        expertiseTags: validatedData.expertise_tags || null,
        subjects: validatedData.subjects || null,
        bio: validatedData.bio || null,
        rating: 5.0
      }
    })

    return NextResponse.json({ 
      success: true, 
      trainerId: newTrainer.id 
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error creating trainer:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

