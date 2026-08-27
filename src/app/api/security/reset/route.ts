import { NextRequest, NextResponse } from 'next/server'
import { getSession, deleteSession } from '@/lib/session'
import { resetUserSecurity } from '@/lib/securityService'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.userId || 1
    const userRole = session?.role || 'student'
    const currentSessionId = (session as any)?.sessionId || `sess_active_${userId}`

    // 1. Revoke all sessions in the security store
    const result = resetUserSecurity(userId, currentSessionId)

    // 2. Delete authenticated session cookie
    await deleteSession()

    // 3. Determine redirect URL based on role
    let redirectUrl = '/auth/student/login'
    if (userRole === 'company') {
      redirectUrl = '/auth/company/login'
    } else if (userRole === 'institution-admin') {
      redirectUrl = '/auth/institution/login'
    }

    return NextResponse.json({
      ...result,
      loggedOut: true,
      redirectUrl
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
  } catch (error: any) {
    console.error('[API /security/reset] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reset security state' },
      { status: 500 }
    )
  }
}
