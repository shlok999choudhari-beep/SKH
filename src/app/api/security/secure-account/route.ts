import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { secureUserAccount } from '@/lib/securityService'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.userId || 1
    const body = await request.json().catch(() => ({}))
    const { sessionId } = body

    const result = secureUserAccount(userId, sessionId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API /security/secure-account] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to secure account' },
      { status: 500 }
    )
  }
}
