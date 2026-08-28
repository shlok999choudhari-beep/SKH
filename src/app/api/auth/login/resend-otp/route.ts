import { NextRequest, NextResponse } from 'next/server'
import { resendLoginOtp } from '@/lib/loginOtpService'
import { z } from 'zod'

const resendSchema = z.object({
  challengeToken: z.string().min(1, 'Challenge token required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = resendSchema.parse(body)

    const resendResult = await resendLoginOtp({
      challengeToken: validated.challengeToken
    })

    if (!resendResult.success) {
      return NextResponse.json(
        {
          error: resendResult.error || 'Failed to resend code.',
          cooldownSeconds: resendResult.cooldownSeconds
        },
        { status: 429 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code sent via email.',
      newChallengeToken: resendResult.newChallengeToken,
      expiresAt: resendResult.expiresAt,
      cooldownSeconds: resendResult.cooldownSeconds
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Resend OTP error:', error)
    return NextResponse.json({ error: 'Failed to resend verification code.' }, { status: 500 })
  }
}
