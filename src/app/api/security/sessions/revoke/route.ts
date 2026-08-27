import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { revokeUserSession } from '@/lib/securityService'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    const session = await getSession()
    const userId = session?.userId || 1
    const currentSessionId = (session as any)?.sessionId || `sess_active_${userId}`

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required in request body' }, { status: 400 })
    }

    const result = revokeUserSession(userId, sessionId, currentSessionId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API /security/sessions/revoke] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to revoke session' },
      { status: 400 }
    )
  }
}
