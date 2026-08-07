import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block tracking/analytics requests
  if (pathname.includes('/hybridaction/') || pathname.includes('zybTrackerStatisticsAction')) {
    return new NextResponse(null, { status: 204 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
