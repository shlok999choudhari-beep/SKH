import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const devices = await (prisma as any).trustedDevice.findMany({
      where: {
        userId: session.userId,
        userRole: session.role,
        isTrusted: true
      },
      orderBy: { lastUsedAt: 'desc' }
    })

    return NextResponse.json({ success: true, devices })
  } catch (error: any) {
    console.error('Fetch trusted devices error:', error)
    return NextResponse.json({ error: 'Failed to fetch trusted devices.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 })
    }

    await (prisma as any).trustedDevice.deleteMany({
      where: {
        userId: session.userId,
        userRole: session.role,
        deviceId
      }
    })

    return NextResponse.json({ success: true, message: 'Trusted device revoked successfully.' })
  } catch (error: any) {
    console.error('Revoke trusted device error:', error)
    return NextResponse.json({ error: 'Failed to revoke trusted device.' }, { status: 500 })
  }
}
