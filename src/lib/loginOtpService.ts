/**
 * PlaceIQ Secure Login OTP & Challenge Service
 * Cryptographic OTP generation, hashing, verification, rate limiting, and device trust registration.
 */

import crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { sendLoginOtpEmail } from '@/lib/emailService'

const CHALLENGE_SECRET = process.env.SESSION_SECRET || 'placeiq-login-challenge-auth-token-secret-32-chars!'
const encodedChallengeKey = new TextEncoder().encode(CHALLENGE_SECRET)

export interface ChallengePayload {
  challengeId: string
  userId: number
  userRole: 'student' | 'company' | 'institution-admin'
  email: string
  name: string
  otpHash: string
  deviceId?: string
  browser?: string
  os?: string
  ip?: string
  location?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskReasons: string[]
  expiresAtMs: number
}

// In-memory challenge state tracker for instant fail-safe validation
interface MemoryChallengeRecord {
  challengeId: string
  userId: number
  email: string
  currentOtpHash: string
  attemptCount: number
  resendCount: number
  lastResentAt: number
  expiresAtMs: number
  isUsed: boolean
}

const memoryChallengeStore = new Map<string, MemoryChallengeRecord>()

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export function generateSecureOtp(): string {
  const num = crypto.randomInt(100000, 1000000)
  return num.toString()
}

/**
 * Computes SHA-256 hash of an OTP for zero-plaintext database storage
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex')
}

/**
 * Masks an email address for privacy in verification screens (e.g. s••••••@gmail.com)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`
  }
  const visible = local.slice(0, 2)
  const masked = '*'.repeat(Math.min(6, local.length - 2))
  return `${visible}${masked}@${domain}`
}

/**
 * Issues a signed challenge token for multi-step authentication
 */
export async function signChallengeToken(payload: ChallengePayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(encodedChallengeKey)
}

/**
 * Verifies and decodes a signed challenge token
 */
export async function decodeChallengeToken(token: string): Promise<ChallengePayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedChallengeKey, { algorithms: ['HS256'] })
    return payload as unknown as ChallengePayload
  } catch {
    return null
  }
}

/**
 * Initiates a login security challenge: generates OTP, saves hash, and sends email via Resend
 */
export async function initiateLoginChallenge({
  userId,
  userRole,
  email,
  name,
  deviceId,
  browser = 'Chrome',
  os = 'Windows',
  ip = '103.211.54.21',
  location = 'Pune, Maharashtra',
  riskLevel,
  riskReasons
}: {
  userId: number
  userRole: 'student' | 'company' | 'institution-admin'
  email: string
  name: string
  deviceId?: string
  browser?: string
  os?: string
  ip?: string
  location?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskReasons: string[]
}): Promise<{
  success: boolean
  challengeToken: string
  maskedEmail: string
  expiresAt: string
  deviceInfo: { browser: string; os: string; location: string }
  error?: string
  devOtpHint?: string
}> {
  const otp = generateSecureOtp()
  const otpHash = hashOtp(otp)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  const challengeId = `chal_${userId}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`

  // Save to memory store
  memoryChallengeStore.set(challengeId, {
    challengeId,
    userId,
    email,
    currentOtpHash: otpHash,
    attemptCount: 0,
    resendCount: 0,
    lastResentAt: Date.now(),
    expiresAtMs: expiresAt.getTime(),
    isUsed: false
  })

  const challengeToken = await signChallengeToken({
    challengeId,
    userId,
    userRole,
    email,
    name,
    otpHash,
    deviceId,
    browser,
    os,
    ip,
    location,
    riskLevel,
    riskReasons,
    expiresAtMs: expiresAt.getTime()
  })

  // Store OTP record in database
  try {
    await (prisma as any).loginOtp.create({
      data: {
        userId,
        userRole,
        email,
        otpHash,
        purpose: 'LOGIN_VERIFICATION',
        challengeToken,
        deviceId: deviceId || null,
        browser,
        os,
        ip,
        location,
        attemptCount: 0,
        maxAttempts: 5,
        isUsed: false,
        expiresAt,
        resendCount: 0,
        lastResentAt: new Date()
      }
    })
  } catch (err) {
    console.warn('[OtpService] Failed to persist loginOtp in database:', err)
  }

  // Send Email via Resend
  const emailResult = await sendLoginOtpEmail({
    email,
    otp,
    device: `${browser} on ${os}`,
    location,
    expiryMinutes: 5
  })

  if (!emailResult.success) {
    console.error('[OtpService] Resend email delivery failure:', emailResult.error)
  }

  // Record Audit Event
  try {
    await (prisma as any).loginAudit.create({
      data: {
        userId,
        userRole,
        email,
        action: 'OTP_GENERATED',
        status: 'CHALLENGE_REQUIRED',
        riskLevel,
        riskScore: riskLevel === 'HIGH' ? 80 : 40,
        riskReason: riskReasons.join(', ') || 'New Device or Suspicious Activity',
        details: `Generated 6-digit OTP challenge for ${email} from ${browser}/${os} (${location})`,
        timestamp: new Date()
      }
    })
  } catch {}

  console.log(`\n========================================\n[🔐 PlaceIQ Login Shield OTP]\nUser: ${email} (${name || userRole})\nOTP Code: ${otp}\nExpires: ${expiresAt.toLocaleTimeString()}\n========================================\n`)

  const isDev = process.env.NODE_ENV !== 'production'

  return {
    success: true,
    challengeToken,
    maskedEmail: maskEmail(email),
    expiresAt: expiresAt.toISOString(),
    deviceInfo: { browser, os, location },
    devOtpHint: isDev ? otp : undefined
  }
}

/**
 * Validates a submitted 6-digit OTP against the active challenge
 */
export async function verifySubmittedOtp({
  challengeToken,
  submittedOtp,
  trustDevice = false
}: {
  challengeToken: string
  submittedOtp: string
  trustDevice?: boolean
}): Promise<{
  success: boolean
  user?: {
    id: number
    role: 'student' | 'company' | 'institution-admin'
    email: string
    name: string
  }
  error?: string
  remainingAttempts?: number
  isLocked?: boolean
}> {
  const challenge = await decodeChallengeToken(challengeToken)
  if (!challenge) {
    return { success: false, error: 'Challenge session expired or invalid. Please sign in again.' }
  }

  if (Date.now() > challenge.expiresAtMs) {
    return { success: false, error: 'Verification code has expired. Please request a new code.' }
  }

  const cleanOtp = submittedOtp.trim()
  if (!/^\d{6}$/.test(cleanOtp)) {
    return { success: false, error: 'Please enter a valid 6-digit numeric verification code.' }
  }

  // Retrieve memory record if available
  const memRecord = memoryChallengeStore.get(challenge.challengeId) || {
    challengeId: challenge.challengeId,
    userId: challenge.userId,
    email: challenge.email,
    currentOtpHash: challenge.otpHash,
    attemptCount: 0,
    resendCount: 0,
    lastResentAt: Date.now(),
    expiresAtMs: challenge.expiresAtMs,
    isUsed: false
  }

  if (memRecord.isUsed) {
    return { success: false, error: 'This verification code has already been used. Please sign in again.' }
  }

  // Check attempt limit (max 5)
  if (memRecord.attemptCount >= 5) {
    try {
      await (prisma as any).loginAudit.create({
        data: {
          userId: challenge.userId,
          userRole: challenge.userRole,
          email: challenge.email,
          action: 'OTP_LOCKED',
          status: 'BLOCKED',
          riskLevel: 'HIGH',
          riskScore: 90,
          riskReason: 'MAX_OTP_ATTEMPTS_EXCEEDED',
          browser: challenge.browser,
          os: challenge.os,
          ip: challenge.ip,
          location: challenge.location,
          details: 'Too many incorrect OTP attempts. Challenge locked.',
          timestamp: new Date()
        }
      })
    } catch {}

    return {
      success: false,
      error: 'Too many incorrect verification attempts. Verification temporarily blocked.',
      isLocked: true,
      remainingAttempts: 0
    }
  }

  // Find DB OTP record if table exists
  let otpRecord = null
  try {
    otpRecord = await (prisma as any).loginOtp.findFirst({
      where: {
        challengeToken,
        isUsed: false
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (err) {}

  const submittedHash = hashOtp(cleanOtp)

  // Validate OTP against:
  // 1. Signed JWT token payload hash
  // 2. In-memory store active hash (for resends)
  // 3. Database record hash
  const isMatch =
    (challenge.otpHash && challenge.otpHash === submittedHash) ||
    (memRecord.currentOtpHash && memRecord.currentOtpHash === submittedHash) ||
    (otpRecord && otpRecord.otpHash === submittedHash)

  if (!isMatch) {
    memRecord.attemptCount += 1
    memoryChallengeStore.set(challenge.challengeId, memRecord)

    const remaining = Math.max(0, 5 - memRecord.attemptCount)

    // Update DB attempt count if record exists
    if (otpRecord) {
      try {
        await (prisma as any).loginOtp.update({
          where: { id: otpRecord.id },
          data: { attemptCount: memRecord.attemptCount }
        })
      } catch {}
    }

    // Log Failed Attempt
    try {
      await (prisma as any).loginAudit.create({
        data: {
          userId: challenge.userId,
          userRole: challenge.userRole,
          email: challenge.email,
          action: 'OTP_FAILED',
          status: 'FAILED',
          riskLevel: challenge.riskLevel,
          riskScore: 60,
          riskReason: `INCORRECT_OTP (${memRecord.attemptCount}/5 attempts)`,
          browser: challenge.browser,
          os: challenge.os,
          ip: challenge.ip,
          location: challenge.location,
          details: `Incorrect OTP attempt (${memRecord.attemptCount}/5)`,
          timestamp: new Date()
        }
      })
    } catch {}

    if (remaining === 0) {
      return {
        success: false,
        error: 'Too many incorrect verification attempts. Please sign in again.',
        isLocked: true,
        remainingAttempts: 0
      }
    }

    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
      remainingAttempts: remaining
    }
  }

  // OTP is Valid: Mark used in memory & DB
  memRecord.isUsed = true
  memoryChallengeStore.set(challenge.challengeId, memRecord)

  if (otpRecord) {
    try {
      await (prisma as any).loginOtp.update({
        where: { id: otpRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
          trustDevice
        }
      })
    } catch {}
  }

  // Register Trust Device if checked
  if (trustDevice && challenge.deviceId) {
    try {
      await (prisma as any).trustedDevice.upsert({
        where: {
          userId_userRole_deviceId: {
            userId: challenge.userId,
            userRole: challenge.userRole,
            deviceId: challenge.deviceId
          }
        },
        create: {
          userId: challenge.userId,
          userRole: challenge.userRole,
          deviceId: challenge.deviceId,
          browser: challenge.browser,
          os: challenge.os,
          ip: challenge.ip,
          location: challenge.location,
          isTrusted: true,
          trustedAt: new Date(),
          lastUsedAt: new Date()
        },
        update: {
          isTrusted: true,
          lastUsedAt: new Date(),
          ip: challenge.ip,
          location: challenge.location
        }
      })
    } catch (err) {}
  }

  // Log OTP Verified
  try {
    await (prisma as any).loginAudit.create({
      data: {
        userId: challenge.userId,
        userRole: challenge.userRole,
        email: challenge.email,
        action: 'OTP_VERIFIED',
        status: 'SUCCESS',
        riskLevel: 'LOW',
        riskScore: 0,
        browser: challenge.browser,
        os: challenge.os,
        ip: challenge.ip,
        location: challenge.location,
        details: 'Identity verified successfully via Resend email OTP.',
        timestamp: new Date()
      }
    })
  } catch {}

  return {
    success: true,
    user: {
      id: challenge.userId,
      role: challenge.userRole,
      email: challenge.email,
      name: challenge.name
    }
  }
}

/**
 * Resends a fresh OTP code to the challenged user with cooldown enforcement
 */
export async function resendLoginOtp({
  challengeToken
}: {
  challengeToken: string
}): Promise<{
  success: boolean
  newChallengeToken?: string
  expiresAt?: string
  cooldownSeconds?: number
  error?: string
}> {
  const challenge = await decodeChallengeToken(challengeToken)
  if (!challenge) {
    return { success: false, error: 'Challenge session has expired. Please sign in again.' }
  }

  // Check cooldown & limits from memory or DB
  const memRecord = memoryChallengeStore.get(challenge.challengeId) || {
    challengeId: challenge.challengeId,
    userId: challenge.userId,
    email: challenge.email,
    currentOtpHash: challenge.otpHash,
    attemptCount: 0,
    resendCount: 0,
    lastResentAt: 0,
    expiresAtMs: challenge.expiresAtMs,
    isUsed: false
  }

  const timeSinceLastResend = (Date.now() - memRecord.lastResentAt) / 1000
  if (memRecord.lastResentAt > 0 && timeSinceLastResend < 45) {
    const waitSeconds = Math.ceil(45 - timeSinceLastResend)
    return {
      success: false,
      error: `Please wait ${waitSeconds} seconds before requesting another code.`,
      cooldownSeconds: waitSeconds
    }
  }

  if (memRecord.resendCount >= 3) {
    return {
      success: false,
      error: 'Maximum verification resend limit reached. Please sign in again.'
    }
  }

  const newOtp = generateSecureOtp()
  const newOtpHash = hashOtp(newOtp)
  const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000)

  // Update memory store
  memRecord.currentOtpHash = newOtpHash
  memRecord.expiresAtMs = newExpiresAt.getTime()
  memRecord.attemptCount = 0
  memRecord.resendCount += 1
  memRecord.lastResentAt = Date.now()
  memoryChallengeStore.set(challenge.challengeId, memRecord)

  // Create new signed token with new otpHash
  const newChallengeToken = await signChallengeToken({
    ...challenge,
    otpHash: newOtpHash,
    expiresAtMs: newExpiresAt.getTime()
  })

  // Update DB record if exists
  try {
    const otpRecord = await (prisma as any).loginOtp.findFirst({
      where: { challengeToken },
      orderBy: { createdAt: 'desc' }
    })
    if (otpRecord) {
      await (prisma as any).loginOtp.update({
        where: { id: otpRecord.id },
        data: {
          otpHash: newOtpHash,
          expiresAt: newExpiresAt,
          attemptCount: 0,
          resendCount: memRecord.resendCount,
          lastResentAt: new Date()
        }
      })
    }
  } catch {}

  // Send Email via Resend
  const emailResult = await sendLoginOtpEmail({
    email: challenge.email,
    otp: newOtp,
    device: `${challenge.browser || 'Chrome'} on ${challenge.os || 'Windows'}`,
    location: challenge.location || 'Pune, Maharashtra',
    expiryMinutes: 5
  })

  console.log(`\n========================================\n[🔐 PlaceIQ Login Shield RESENT OTP]\nUser: ${challenge.email}\nOTP Code: ${newOtp}\nExpires: ${newExpiresAt.toLocaleTimeString()}\n========================================\n`)

  if (!emailResult.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[OtpService] Resend email delivery failed, but allowing local OTP in dev mode.')
    } else {
      return { success: false, error: 'Failed to deliver new code. Please try again.' }
    }
  }

  return {
    success: true,
    newChallengeToken,
    expiresAt: newExpiresAt.toISOString(),
    cooldownSeconds: 45
  }
}
