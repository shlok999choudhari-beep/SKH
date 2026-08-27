import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { revokeUserSession } from '@/lib/securityService'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    const userId = session?.userId || 1
    const currentSessionId = (session as any)?.sessionId || `sess_active_${userId}`

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const result = revokeUserSession(userId, id, currentSessionId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API /security/sessions/[id]/revoke] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to revoke session' },
      { status: 400 }
    )
  }
}
