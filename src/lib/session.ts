import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET || 'fallback-secret-32-chars-minimum!!'
const encodedKey = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  userId: number
  role: 'student' | 'company'
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

export async function createSession(payload: SessionPayload): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const token = await encrypt({ ...payload, expiresAt })
  const cookieStore = await cookies()
  cookieStore.set('placeiq_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('placeiq_session')?.value
  return decrypt(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('placeiq_session')
}
