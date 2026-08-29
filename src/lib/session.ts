import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'
import { registerSession } from '@/lib/securityService'

const secretKey = process.env.SESSION_SECRET || 'fallback-secret-32-chars-minimum!!'
const encodedKey = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  sessionId?: string
  userId: number
  role: 'student' | 'company' | 'institution-admin' | 'trainer'
  email: string
  name: string
  expiresAt: Date
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const sessionId =
    payload.sessionId ||
    `sess_${payload.userId}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`

  try {
    const headerStore = await headers()
    const userAgent = headerStore.get('user-agent') || ''
    const ip =
      headerStore.get('x-forwarded-for')?.split(',')[0].trim() ||
      headerStore.get('x-real-ip') ||
      '103.211.54.21'

    registerSession({
      sessionId,
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      name: payload.name,
      userAgent,
      ip
    })
  } catch (err) {
    console.warn('[Session] Failed to read headers for security telemetry:', err)
  }

  const token = await encrypt({ ...payload, sessionId, expiresAt })
  try {
    const cookieStore = await cookies()
    cookieStore.set('demo_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      sameSite: 'lax',
      path: '/',
    })
  } catch (err) {
    console.warn('[Session] Failed to set cookie on cookieStore:', err)
  }
  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('demo_session')?.value
  return decrypt(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('demo_session')
}
