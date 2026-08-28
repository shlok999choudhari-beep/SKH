import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/session'
import { verifySubmittedOtp } from '@/lib/loginOtpService'
import { resetFailedLoginAttempts } from '@/lib/loginRiskEngine'
import { z } from 'zod'

const verifyOtpSchema = z.object({
  challengeToken: z.string().min(1, 'Challenge token required'),
  otp: z.string().min(6, '6-digit OTP code required').max(6, '6-digit OTP code required'),
  trustDevice: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = verifyOtpSchema.parse(body)

    const verificationResult = await verifySubmittedOtp({
      challengeToken: validated.challengeToken,
      submittedOtp: validated.otp,
      trustDevice: validated.trustDevice
    })

    if (!verificationResult.success || !verificationResult.user) {
      return NextResponse.json(
        {
          error: verificationResult.error || 'Verification failed. Please try again.',
          remainingAttempts: verificationResult.remainingAttempts,
          isLocked: verificationResult.isLocked
        },
        { status: verificationResult.isLocked ? 429 : 400 }
      )
    }

    const { user } = verificationResult

    // Reset failed login attempts
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '103.211.54.21'
    resetFailedLoginAttempts(user.email, ip)

    // Create Authenticated Session
    await createSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    let redirectUrl = '/student/dashboard'
    if (user.role === 'company') {
      redirectUrl = '/company/dashboard'
    } else if (user.role === 'institution-admin') {
      redirectUrl = '/institution/dashboard'
    }

    const response = NextResponse.json({
      status: 'SUCCESS',
      message: 'Identity verified successfully.',
      redirectUrl
    })

    if (validated.trustDevice && verificationResult.deviceId) {
      response.cookies.set('placeiq_trusted_device', verificationResult.deviceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: 'lax',
        path: '/'
      })
    }

    return response
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Failed to verify verification code.' }, { status: 500 })
  }
}
