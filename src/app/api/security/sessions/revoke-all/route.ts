import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { revokeAllOtherUserSessions } from '@/lib/securityService'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.userId || 1
    const currentSessionId = (session as any)?.sessionId || `sess_active_${userId}`

    const result = revokeAllOtherUserSessions(userId, currentSessionId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API /security/sessions/revoke-all] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to revoke other sessions' },
      { status: 500 }
    )
  }
}
