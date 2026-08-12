import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const updateResourceSchema = z.object({
  name: z.string().min(2, 'Name is required').optional(),
  type: z.string().min(2, 'Type is required').optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  availability: z.string().optional(),
  facilities: z.string().optional(),
  status: z.string().optional(),
  sharingEnabled: z.boolean().optional(),
  availableToStudents: z.boolean().optional(),
})

// Check user auth and get their institutionId
async function checkAuth() {
  const session = await getSession()
  if (!session || session.role !== 'institution-admin') {
    return { error: 'Unauthorized', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { institutionId: true, id: true }
  })

  if (!user || !user.institutionId) {
    return { error: 'Institution not found', status: 404 }
  }

  return { institutionId: user.institutionId, userId: user.id }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resourceId = parseInt(id, 10)
    if (isNaN(resourceId)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 })
    }

    const auth = await checkAuth()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        institution: {
          select: { name: true }
        }
      }
    })

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Only allow if sharing is enabled OR it belongs to this institution
    if (resource.institutionId !== auth.institutionId && !resource.sharingEnabled) {
      return NextResponse.json({ error: 'Unauthorized access to resource' }, { status: 403 })
    }

    return NextResponse.json({ resource })
  } catch (error: any) {
    console.error('Error fetching resource details:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resourceId = parseInt(id, 10)
    if (isNaN(resourceId)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 })
    }

    const auth = await checkAuth()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Guard: only the owner institution can update
    if (resource.institutionId !== auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized to edit this resource' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateResourceSchema.parse(body)

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        name: validatedData.name !== undefined ? validatedData.name : resource.name,
        type: validatedData.type !== undefined ? validatedData.type : resource.type,
        category: validatedData.category !== undefined ? validatedData.category : resource.category,
        description: validatedData.description !== undefined ? validatedData.description : resource.description,
        location: validatedData.location !== undefined ? validatedData.location : resource.location,
        capacity: validatedData.capacity !== undefined ? validatedData.capacity : resource.capacity,
        availability: validatedData.availability !== undefined ? validatedData.availability : resource.availability,
        facilities: validatedData.facilities !== undefined ? validatedData.facilities : resource.facilities,
        status: validatedData.status !== undefined ? validatedData.status : resource.status,
        sharingEnabled: validatedData.sharingEnabled !== undefined ? validatedData.sharingEnabled : resource.sharingEnabled,
        availableToStudents: validatedData.availableToStudents !== undefined ? validatedData.availableToStudents : resource.availableToStudents
      }
    })

    return NextResponse.json({ success: true, resource: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: (error as any).errors }, { status: 400 })
    }
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const resourceId = parseInt(id, 10)
    if (isNaN(resourceId)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 })
    }

    const auth = await checkAuth()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Guard: only the owner institution can delete
    if (resource.institutionId !== auth.institutionId) {
      return NextResponse.json({ error: 'Unauthorized to delete this resource' }, { status: 403 })
    }

    await prisma.resource.delete({
      where: { id: resourceId }
    })

    return NextResponse.json({ success: true, message: 'Resource deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
