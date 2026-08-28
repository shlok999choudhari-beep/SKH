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
  email: z.string().min(1, 'Email or username is required').trim(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['student', 'company', 'institution']).default('student'),
  deviceId: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  deviceType: z.string().optional(),
  location: z.string().optional()
})

async function findStudentByIdentifier(identifier: string) {
  return await prisma.student.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: 'insensitive' } },
        { name: { equals: identifier, mode: 'insensitive' } },
        { email: { startsWith: `${identifier}@`, mode: 'insensitive' } },
        { phone: { equals: identifier } }
      ]
    }
  })
}

async function findCompanyByIdentifier(identifier: string) {
  return await prisma.company.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: 'insensitive' } },
        { companyName: { equals: identifier, mode: 'insensitive' } },
        { email: { startsWith: `${identifier}@`, mode: 'insensitive' } },
        { phone: { equals: identifier } }
      ]
    }
  })
}

async function findInstitutionUserByIdentifier(identifier: string) {
  return await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: 'insensitive' } },
        { name: { equals: identifier, mode: 'insensitive' } },
        { email: { startsWith: `${identifier}@`, mode: 'insensitive' } }
      ]
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    const userAgent = request.headers.get('user-agent') || 'Unknown Browser'
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '103.211.54.21'

    const identifier = validated.email.trim()
    const role = validated.role

    // 1. Retrieve User strictly by the selected Role Portal
    let user: { id: number; email: string; name: string; password: string } | null = null
    let authRole: 'student' | 'company' | 'institution-admin' | 'trainer' = 'student'
    let redirectUrl = '/student/dashboard'

    if (role === 'student') {
      const student = await findStudentByIdentifier(identifier)
      if (student) {
        user = { id: student.id, email: student.email, name: student.name, password: student.password }
        authRole = 'student'
        redirectUrl = '/student/dashboard'
      } else {
        // Check if user belongs to another role to give an explicit, helpful message
        const isCompany = await findCompanyByIdentifier(identifier)
        if (isCompany) {
          return NextResponse.json(
            { error: 'This account is registered as a Company. Please select the Company tab to sign in.' },
            { status: 400 }
          )
        }
        const isInst = await findInstitutionUserByIdentifier(identifier)
        if (isInst) {
          return NextResponse.json(
            { error: 'This account is registered as an Institution user. Please select the Institution tab to sign in.' },
            { status: 400 }
          )
        }
      }
    } else if (role === 'company') {
      const company = await findCompanyByIdentifier(identifier)
      if (company) {
        user = { id: company.id, email: company.email, name: company.companyName, password: company.password }
        authRole = 'company'
        redirectUrl = '/company/dashboard'
      } else {
        const isStudent = await findStudentByIdentifier(identifier)
        if (isStudent) {
          return NextResponse.json(
            { error: 'This account is registered as a Student. Please select the Student tab to sign in.' },
            { status: 400 }
          )
        }
        const isInst = await findInstitutionUserByIdentifier(identifier)
        if (isInst) {
          return NextResponse.json(
            { error: 'This account is registered as an Institution user. Please select the Institution tab to sign in.' },
            { status: 400 }
          )
        }
      }
    } else if (role === 'institution') {
      const instUser = await findInstitutionUserByIdentifier(identifier)
      if (instUser) {
        user = { id: instUser.id, email: instUser.email, name: instUser.name, password: instUser.password }
        if (instUser.role === 'trainer') {
          authRole = 'trainer'
          redirectUrl = '/trainer/dashboard'
        } else {
          authRole = 'institution-admin'
          redirectUrl = '/institution/dashboard'
        }
      } else {
        const isStudent = await findStudentByIdentifier(identifier)
        if (isStudent) {
          return NextResponse.json(
            { error: 'This account is registered as a Student. Please select the Student tab to sign in.' },
            { status: 400 }
          )
        }
        const isCompany = await findCompanyByIdentifier(identifier)
        if (isCompany) {
          return NextResponse.json(
            { error: 'This account is registered as a Company. Please select the Company tab to sign in.' },
            { status: 400 }
          )
        }
      }
    }

    // Generic error to prevent account enumeration if not found anywhere
    if (!user) {
      const attempt = recordFailedLoginAttempt(identifier, ip)
      return NextResponse.json(
        {
          error: attempt.isLocked
            ? `Too many failed attempts. Login temporarily restricted for ${Math.ceil((attempt.lockRemainingSeconds || 900) / 60)} minutes.`
            : 'Invalid email/username or password.'
        },
        { status: 401 }
      )
    }

    // 2. Validate Password with Legacy Support & Auto-Sync
    let passwordMatch = false
    const isBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')

    if (isBcrypt) {
      try {
        passwordMatch = await bcrypt.compare(validated.password, user.password)
      } catch {
        passwordMatch = false
      }
    }

    // Legacy plain-text password fallback
    if (!passwordMatch && user.password === validated.password) {
      passwordMatch = true
    }

    if (!passwordMatch) {
      const attempt = recordFailedLoginAttempt(user.email, ip)

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
            details: `Failed password attempt (${attempt.count}) for ${user.email} from IP ${ip}`,
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

      return NextResponse.json({ error: 'Invalid email/username or password.' }, { status: 401 })
    }

    // If authenticated via legacy plain-text password, auto-upgrade and hash in database!
    if (passwordMatch && !isBcrypt) {
      try {
        const upgradedHash = await bcrypt.hash(validated.password, 12)
        if (authRole === 'student') {
          await prisma.student.update({ where: { id: user.id }, data: { password: upgradedHash } })
        } else if (authRole === 'company') {
          await prisma.company.update({ where: { id: user.id }, data: { password: upgradedHash } })
        } else {
          await prisma.user.update({ where: { id: user.id }, data: { password: upgradedHash } })
        }
        console.log(`[Auth Security Sync] Upgraded legacy password for ${user.email} (${authRole}) to 12-round Bcrypt hash.`)
      } catch (err) {
        console.warn('[Auth Security Sync] Could not upgrade password in DB:', err)
      }
    }

    // 3. Evaluate Adaptive Login Risk
    const trustedDeviceCookie = request.cookies.get('placeiq_trusted_device')?.value
    const effectiveDeviceId = validated.deviceId || trustedDeviceCookie

    const riskAssessment = await evaluateLoginRisk({
      userId: user.id,
      userRole: authRole,
      email: user.email,
      userAgent,
      ip,
      clientDeviceId: effectiveDeviceId,
      clientBrowser: validated.browser,
      clientOs: validated.os,
      clientLocation: validated.location,
      trustedDeviceCookie
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
        deviceId: effectiveDeviceId,
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
        expiresAt: challenge.expiresAt,
        devOtpHint: challenge.devOtpHint
      })
    }

    // 6. Trusted / Low Risk Direct Login
    resetFailedLoginAttempts(user.email, ip)

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
          deviceId: effectiveDeviceId,
          browser: riskAssessment.deviceSummary.browser,
          os: riskAssessment.deviceSummary.os,
          ip,
          location: riskAssessment.deviceSummary.location,
          details: `Direct login for ${user.email} (${authRole}) from recognized device (${riskAssessment.deviceSummary.browser} on ${riskAssessment.deviceSummary.os})`,
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

    const response = NextResponse.json({
      status: 'SUCCESS',
      message: 'Login verified successfully.',
      redirectUrl
    })

    if (effectiveDeviceId) {
      response.cookies.set('placeiq_trusted_device', effectiveDeviceId, {
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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Authentication service error. Please try again.' }, { status: 500 })
  }
}
