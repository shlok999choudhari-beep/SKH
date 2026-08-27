import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getUserLoginHistory } from '@/lib/securityService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.userId || 1
    const userEmail = session?.email || 'student@placeiq.internal'
    const userName = session?.name || 'Student User'
    const userRole = session?.role || 'student'
    const sessionId = (session as any)?.sessionId || `sess_active_${userId}`

    let history = getUserLoginHistory(
      userId,
      userEmail,
      userName,
      userRole,
      sessionId
    )

    // Merge real database LoginAudit records
    try {
      const dbAudits = await (prisma as any).loginAudit.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 20
      })

      if (dbAudits && dbAudits.length > 0) {
        const auditItems = dbAudits.map((a: any) => ({
          id: `audit_${a.id}`,
          status: a.status === 'SUCCESS' ? 'successful' : (a.status === 'FAILED' || a.status === 'BLOCKED' || a.status === 'RESTRICTED') ? 'failed' : 'successful',
          isCurrent: false,
          device: `${a.browser || 'Chrome'} • ${a.os || 'Windows'}`,
          browser: a.browser || 'Chrome',
          os: a.os || 'Windows',
          deviceType: a.deviceType || 'desktop',
          location: a.location || 'Pune, Maharashtra',
          loginTime: new Date(a.timestamp).toISOString(),
          lastActivity: new Date(a.timestamp).toISOString(),
          logoutTime: null,
          sessionDuration: a.status === 'SUCCESS' ? '01h 05m' : '—',
          riskLevel: (a.riskLevel || 'LOW').toLowerCase(),
          riskReason: a.riskReason || a.details,
          isSuspicious: a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL'
        }))

        const existingMap = new Map<string, any>()
        history.forEach((h: any) => existingMap.set(h.id, h))
        auditItems.forEach((item: any) => existingMap.set(item.id, item))

        history = Array.from(existingMap.values()).sort(
          (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
        )
      }
    } catch (err) {
      console.warn('DB login audits fetch fallback:', err)
    }

    return NextResponse.json({
      history,
      count: history.length
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })

  } catch (error: any) {
    console.error('[API /security/login-history] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve login history' },
      { status: 500 }
    )
  }
}
