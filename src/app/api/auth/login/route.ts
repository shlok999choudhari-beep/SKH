import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'
import {
  evaluateLoginRisk,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts
} from '@/lib/loginRiskEngine'
import { initiateLoginChallenge } from '@/lib/loginOtpService'
import { sendNewLoginAlertEmail } from '@/lib/emailService'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['student', 'company', 'institution']).default('student'),
  deviceId: z.string().optional(),
  location: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    const userAgent = request.headers.get('user-agent') || 'Unknown Browser'
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '103.211.54.21'

    const email = validated.email.toLowerCase()
    const role = validated.role

    // 1. Retrieve User by Role
    let user: { id: number; email: string; name: string; password: string } | null = null
    let authRole: 'student' | 'company' | 'institution-admin' = 'student'
    let redirectUrl = '/student/dashboard'

    if (role === 'student') {
      const student = await prisma.student.findUnique({ where: { email } })
      if (student) {
        user = { id: student.id, email: student.email, name: student.name, password: student.password }
        authRole = 'student'
        redirectUrl = '/student/dashboard'
      }
    } else if (role === 'company') {
      const company = await prisma.company.findUnique({ where: { email } })
      if (company) {
        user = { id: company.id, email: company.email, name: company.companyName, password: company.password }
        authRole = 'company'
        redirectUrl = '/company/dashboard'
      }
    } else if (role === 'institution') {
      const instUser = await prisma.user.findUnique({ where: { email } })
      if (instUser) {
        user = { id: instUser.id, email: instUser.email, name: instUser.name, password: instUser.password }
        authRole = 'institution-admin'
        redirectUrl = '/institution/dashboard'
      }
    }

    // Generic error to prevent account enumeration
    if (!user) {
      const attempt = recordFailedLoginAttempt(email, ip)
      return NextResponse.json(
        {
          error: attempt.isLocked
            ? `Too many failed attempts. Login temporarily restricted for ${Math.ceil((attempt.lockRemainingSeconds || 900) / 60)} minutes.`
            : 'Invalid email or password.'
        },
        { status: 401 }
      )
    }

    // 2. Validate Password
    const passwordMatch = await bcrypt.compare(validated.password, user.password)
    if (!passwordMatch) {
      const attempt = recordFailedLoginAttempt(email, ip)

      // Log Failed Password Attempt
      try {
        await (prisma as any).loginAudit.create({
          data: {
            userId: user.id,
            userRole: authRole,
            email: user.email,
            action: 'LOGIN_FAILED',
            status: attempt.isLocked ? 'BLOCKED' : 'FAILED',
            riskLevel: attempt.isLocked ? 'CRITICAL' : attempt.count >= 4 ? 'HIGH' : 'LOW',
            riskScore: attempt.isLocked ? 95 : attempt.count * 15,
            riskReason: attempt.isLocked ? 'BRUTE_FORCE_LOCK' : 'INCORRECT_PASSWORD',
            ip,
            location: validated.location || 'Pune, Maharashtra',
            details: `Failed password attempt (${attempt.count}) from IP ${ip}`,
            timestamp: new Date()
          }
        })
      } catch { }

      if (attempt.isLocked) {
        return NextResponse.json(
          {
            error: 'Account login temporarily locked due to excessive failed attempts. Please try again in 15 minutes.'
          },
          { status: 429 }
        )
      }

      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // 3. Evaluate Adaptive Login Risk
    const riskAssessment = await evaluateLoginRisk({
      userId: user.id,
      userRole: authRole,
      email: user.email,
      userAgent,
      ip,
      clientDeviceId: validated.deviceId,
      clientLocation: validated.location
    })

    // 4. Handle Critical / Attack Restriction
    if (riskAssessment.isRestricted || riskAssessment.riskLevel === 'CRITICAL') {
      try {
        await (prisma as any).loginAudit.create({
          data: {
            userId: user.id,
            userRole: authRole,
            email: user.email,
            action: 'LOGIN_RESTRICTED',
            status: 'RESTRICTED',
            riskLevel: 'CRITICAL',
            riskScore: riskAssessment.riskScore,
            riskReason: riskAssessment.riskReasons.join(', '),
            ip,
            location: riskAssessment.deviceSummary.location,
            details: 'Login attempt rejected due to active brute-force rate limit.',
            timestamp: new Date()
          }
        })
      } catch { }

      return NextResponse.json(
        {
          error: `Temporary login restriction active. Please try again in ${Math.ceil((riskAssessment.lockRemainingSeconds || 900) / 60)} minutes.`
        },
        { status: 429 }
      )
    }

    // 5. Handle Challenge Required (New Device / Medium / High Risk)
    if (riskAssessment.requiresChallenge) {
      const challenge = await initiateLoginChallenge({
        userId: user.id,
        userRole: authRole,
        email: user.email,
        name: user.name,
        deviceId: validated.deviceId,
        browser: riskAssessment.deviceSummary.browser,
        os: riskAssessment.deviceSummary.os,
        ip,
        location: riskAssessment.deviceSummary.location,
        riskLevel: riskAssessment.riskLevel,
        riskReasons: riskAssessment.riskReasons
      })

      return NextResponse.json({
        status: 'CHALLENGE_REQUIRED',
        challengeToken: challenge.challengeToken,
        maskedEmail: challenge.maskedEmail,
        riskLevel: riskAssessment.riskLevel,
        riskReasons: riskAssessment.riskReasons,
        deviceInfo: challenge.deviceInfo,
        expiresAt: challenge.expiresAt
      })
    }

    // 6. Trusted / Low Risk Direct Login
    resetFailedLoginAttempts(email, ip)

    await createSession({
      userId: user.id,
      role: authRole,
      email: user.email,
      name: user.name,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    // Log Successful Login
    try {
      await (prisma as any).loginAudit.create({
        data: {
          userId: user.id,
          userRole: authRole,
          email: user.email,
          action: 'LOGIN_SUCCESS',
          status: 'SUCCESS',
          riskLevel: 'LOW',
          riskScore: 0,
          riskReason: 'TRUSTED_DEVICE',
          deviceId: validated.deviceId,
          browser: riskAssessment.deviceSummary.browser,
          os: riskAssessment.deviceSummary.os,
          ip,
          location: riskAssessment.deviceSummary.location,
          details: `Direct login from recognized device (${riskAssessment.deviceSummary.browser} on ${riskAssessment.deviceSummary.os})`,
          timestamp: new Date()
        }
      })
    } catch { }

    // Send Alert email in background if new location/device
    if (riskAssessment.isNewDevice || riskAssessment.isUnusualLocation) {
      sendNewLoginAlertEmail({
        email: user.email,
        device: `${riskAssessment.deviceSummary.browser} on ${riskAssessment.deviceSummary.os}`,
        location: riskAssessment.deviceSummary.location,
        loginTime: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      }).catch(() => { })
    }

    return NextResponse.json({
      status: 'SUCCESS',
      message: 'Login verified successfully.',
      redirectUrl
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Authentication service error. Please try again.' }, { status: 500 })
  }
}
