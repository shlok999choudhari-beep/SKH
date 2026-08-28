import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getCurrentSessionDetails } from '@/lib/securityService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.userId || 1
    const userEmail = session?.email || 'student@placeiq.internal'
    const userName = session?.name || 'Student User'
    const userRole = session?.role || 'student'
    const sessionId = (session as any)?.sessionId || `sess_active_${userId}`

    const userAgent = request.headers.get('user-agent') || ''

    const currentSession = getCurrentSessionDetails(
      userId,
      userEmail,
      userName,
      userRole,
      sessionId,
      userAgent
    )

    return NextResponse.json(currentSession, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  } catch (error: any) {
    console.error('[API /security/current-session] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve current session details' },
      { status: 500 }
    )
  }
}
